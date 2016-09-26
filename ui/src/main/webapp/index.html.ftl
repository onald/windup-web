<#if !userPrincipal??>
    ${dispatchRequest("/not_loggedin.html")!}
</#if>
<html>
<head>
    <title>Windup 3.0</title>
    <base href="/windup-web/">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- PatternFly Styles -->
    <!-- Note: No other CSS files are needed regardless of what other JS packages located in patternfly/components that you decide to pull in -->
    <link rel="stylesheet" href="node_modules/patternfly/dist/css/patternfly.min.css">
    <link rel="stylesheet" href="node_modules/patternfly/dist/css/patternfly-additions.min.css">
    <link rel="stylesheet" href="css/windup-web.css">

    <!-- jQuery -->
    <script src="node_modules/jquery/dist/jquery.min.js"></script>

    <!-- Bootstrap JS -->
    <script src="node_modules/bootstrap/dist/js/bootstrap.min.js"></script>

    <!-- Datatables, jQuery Grid Component -->
    <!-- Note: jquery.dataTables.js must occur in the html source before patternfly*.js.-->
    <script src="node_modules/datatables/media/js/jquery.dataTables.min.js"></script>
    <script src="node_modules/drmonty-datatables-colvis/js/dataTables.colVis.min.js"></script>
    <script src="node_modules/datatables-colreorder/js/dataTables.colReorder.js"></script>

    <!-- PatternFly Custom Componets -  Sidebar, Popovers and Datatables Customizations -->
    <!-- Note: jquery.dataTables.js must occur in the html source before patternfly*.js.-->
    <script src="node_modules/patternfly/dist/js/patternfly.min.js"></script>

    <!-- Bootstrap Combobox -->
    <script src="node_modules/patternfly-bootstrap-combobox/js/bootstrap-combobox.js"></script>

    <!-- Bootstrap Date Picker -->
    <script src="node_modules/bootstrap-datepicker/dist/js/bootstrap-datepicker.min.js"></script>

    <!-- Bootstrap Select -->
    <script src="node_modules/bootstrap-select/dist/js/bootstrap-select.min.js"></script>

    <!-- Bootstrap Switch -->
    <script src="node_modules/bootstrap-switch/dist/js/bootstrap-switch.min.js"></script>

    <!-- Bootstrap Touchspin -->
    <script src="node_modules/bootstrap-touchspin/dist/jquery.bootstrap-touchspin.min.js"></script>

    <!-- Bootstrap Tree View -->
    <script src="node_modules/bootstrap-treeview/dist/bootstrap-treeview.min.js"></script>

    <!-- Google Code Prettify - Syntax highlighting of code snippets -->
    <script src="node_modules/google-code-prettify/bin/prettify.min.js"></script>

    <!-- MatchHeight - Used to make sure dashboard cards are the same height -->
    <script src="node_modules/jquery-match-height/dist/jquery.matchHeight-min.js"></script>

    <!-- Angular Application? You May Want to Consider Pulling Angular-PatternFly And Angular-UI Bootstrap instead of bootstrap.js -->
    <!-- See https://github.com/patternfly/angular-patternfly for more information -->

    <script src="node_modules/core-js/client/shim.min.js"></script>

    <script src="node_modules/zone.js/dist/zone.min.js"></script>
    <script src="node_modules/reflect-metadata/Reflect.js"></script>

    <script src="node_modules/systemjs/dist/system.js"></script>
    <script src="systemjs.config.js"></script>

    <script src="${keycloak.serverUrl}/js/keycloak.js"></script>

    <!-- 2. Configure SystemJS -->
    <script>
        // this is here so that AbstractUITest can tell we are loading the actual app
        window['mainApp'] = true;

        System.import('app').then(null, console.error.bind(console));
    </script>

</head>

<body>
<windup-app></windup-app>
</body>

</html>