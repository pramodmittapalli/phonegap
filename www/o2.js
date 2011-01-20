window.$ = {
  loadJS : function(url,callback) {
    var script = document.createElement('script');
    script.src = url,
    document.body.appendChild(script);
    if (callback) script.onload = callback;
  }
};
window.o2 = {
  data    : null,
  screens : {
    home        : null,
    phones      : null,
    phone       : null,
    accessories : null,
    accessory   : null
  },
  feed     : 'http://pipes.yahoo.com/pipes/pipe.run?_id=77c7bc73b1da7a31958017155be5ca43&_render=json&_callback=',
  callback : 'o2.loadData',
  loadData : function(data) {
    o2.data = {
      accessories : data.value.items[0],
      phones      : data.value.items[1]
    }
    o2.enableAccessories();
    o2.enablePhones();
  },
  enableAccessories : function() {
    var link       = document.getElementById('l-accessories');
    link.className = 'active';
    link.onclick   = o2.displayAccessories;
  },
  enablePhones : function() {
    var link       = document.getElementById('l-phones');
    link.className = 'active';
    link.onclick   = o2.displayPhones;
  },
  displayAccessories : function() {
    o2.displayScreen('accessories');
  },
  displayPhones : function() {
    o2.displayScreen('phones');
  },
  displayScreen : function(screen) {
    console.log(screen);
  }
};
(function() {
o2.screens.home = document.getElementById('home');
  $.loadJS(o2.feed+o2.callback);
})();
