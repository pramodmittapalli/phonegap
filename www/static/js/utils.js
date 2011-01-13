window.$ = {
    loadJS : function(url,callback) {
        var script = document.createElement('script');
        script.src = url,
        document.body.appendChild(script);
        if (callback) script.onload = callback;
    }
};
