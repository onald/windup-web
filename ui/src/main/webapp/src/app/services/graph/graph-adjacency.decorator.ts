import {GraphJSONToModelService} from "./graph-json-to-model.service";
import {Observable} from "rxjs/Observable";
import {Http, Response} from "@angular/http";

/**
 * @GraphAdjacency decorator, which handles TypeScript Frames models' property resolving.
 *
 * The underlying object contains graph vertices data or links to graph REST service.
 * This decorator turns these data into model objects, optionally fetching the data first.
 */
export function GraphAdjacency (name: string, direction: string, array: boolean = true): any {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (descriptor) {
            descriptor.get = function () {

                let verticesLabel = (direction == "IN") ? "vertices_in" : "vertices_out";

                // Data is empty, just return null (or an empty array)
                if (!this.data || !this.data[verticesLabel] || !this.data[verticesLabel][name]
                          ||  (!this.data[verticesLabel][name]["vertices"] && !this.data[verticesLabel][name]["link"]))
                    return Observable.of( array ? [] : null );

                // .graphService and .http are stored by the initial call of fromJSON().
                if (this.graphService == null)
                    console.warn("@GraphAdjacency() sees no graphService on target (should not happen?), will instantiate a default one: ", this);
                let graphService: GraphJSONToModelService<any> = this.graphService || new GraphJSONToModelService();
                if (!this.http)
                    throw new Error("Http service was not stored in the unmarshalled object:\n" + JSON.stringify(this));

                function fetcher(url: string): Observable<any> {
                    return (<Http>this.http).get(url).map((response: Response) => {
                        if (!response) return null;
                        if (typeof response.json() !== "array")
                            throw new Error("Graph REST should return an array of vertices.");
                        let items: any[] = graphService.fromJSONarray(response.json(), this.http);
                        return array ? items : items[0];
                    });
                }

                // If data is a link, return a result of a service call.
                if (this.data[verticesLabel][name]["link"] || this.data[verticesLabel][name]["_type"] == "link") {
                    // Make an HTTP call.
                    let url = this.data[verticesLabel][name]["link"];
                    let cachedObservable: Observable<any> = LinkToDataCache.getOrFetch(url, fetcher);
                    if (!cachedObservable)
                        throw new Error("Failed loading link: " + url);
                    return cachedObservable;

                    /*
                    if (array) {
                        return this.http.get(url).map((response: Response) => {
                            return response.json().map((vertice:any) => {
                                return graphService.fromJSON(vertice, this.http);
                            });
                        });
                    } else {
                        console.log("Should return a single item for: " + name);
                        return this.http.get(url).map((response: Response) => {
                            if (!response)
                                return null;
                            return graphService.fromJSON(response.json()[0], this.http);
                        });
                    }*/
                }

                // Data was not null and not a link, so return the stored value.
                var vertices:any[] = this.data[verticesLabel][name].vertices;

                let value = array ?
                    vertices.map(vertice => graphService.fromJSON(vertice, this.http))
                    : graphService.fromJSON(vertices[0], this.http);

                return Observable.of(value);
            };
        }
    };
}


/**
 * Caches the Observable.of(Response).
 */
class LinkToDataCache
{
    static cachedData: Map<string, any> = new Map<string, any>();
    //static keysFIFO: Set<string> = new Set<string>(); ///string[] = [];
    static maxRequests: number = 400;

    static getOrFetch(key: string, fetcher: (string) => any): Observable<Response> {
        let value = this.cachedData.get(key);
        if (value != null)
            return value;

        value = fetcher(key);
        this.cachedData.set(key, value);
        this.deleteOverflowing();
        return value;
    }

    static add(key, value){
        this.cachedData.set(key, value);
        this.deleteOverflowing();
    }

    static deleteOverflowing(): void {
        while (this.cachedData.size > this.maxRequests) {
            this.deleteOldest(this.maxRequests - this.cachedData.size);
        }
    }

    /// A Map object iterates its elements in insertion order — a for...of loop returns an array of [key, value] for each iteration.
    /// However that seems not to work. Trying with forEach.
    static deleteOldest(howMany: number): void {
        console.log("Deleting oldest " + howMany);
        /*this.cachedData.forEach((val, key, map) => {
            console.log("forEach: " + key + " " + howMany);
            if (howMany-- > 0)
                map.delete(key);
        });*/
        let iterKeys = this.cachedData.keys();
        let item: IteratorResult<string>;
        while (howMany-- > 0 && (item = iterKeys.next(), !item.done))
            this.cachedData.delete(item.value); // Deleting while iterating should be ok in JS.
    }

}
