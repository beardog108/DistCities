window.onload = function(){

if (! WebTorrent.WEBRTC_SUPPORT) {
  $('#error').css('display', 'block');
  $('#error').html('<h1 class="center">Your browser does not support WebRTC. You need this!</h1>');
}

$(window).on('hashchange', function() {
  location.reload();
});

var client = new WebTorrent(); // Startup webtorrent
var text;
var checksum; // Not to be confused with the torrent hash, which is an insecure sha1 hash.

// Get our torrent hash and checksum hash
var hash = window.location.hash.slice(1);
var array = hash.split("&");

var values, form_data = {};

for (var i = 0; i < array.length; i += 1) {
    values = array[i].split("=");
    form_data[values[0]] = values[1];
}

if (form_data['js'] == 'true'){
  var jsConsent = confirm('This page is asking for JavaScript.\nThis is a potential security risk, however, the page may not function without it.\n\nPress cancel to deny JavaScript.');
  if (jsConsent) {
    $('#site').removeAttr('sandbox');
  }
}

hash = form_data['t'];

checksum = form_data['256'];

var buffer;

// Compile the magnet uri

var magnet = 'magnet:?xt=urn:btih:' + hash + '&dn=main.html&tr=udp%3A%2F%2Fexodus.desync.com%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com';

// Detect if the webpage is in localStorage cache or not, and load based on that.

if (localStorage == undefined) {
  downloadFromTorrent(magnet);
}
else {
  if (localStorage[magnet] === undefined) {
    downloadFromTorrent(magnet);
  }
  else {
    loadLocal(magnet);
  }
}

function loadLocal(hash) {
  // Load webpgae from localStorage cache
  console.log('Loading from cached copy.');

  var data = new Blob([localStorage[hash]], {type: 'text/html'});

  $('#loading').css('display', 'none');

  document.getElementById('site').src = URL.createObjectURL(data);

  var parts = [
    new Blob([localStorage[hash]], {type: 'text/html'}),
  ];

  // Construct a file
  var fileName = 'main.html'
  file = new File(parts, fileName, {
      type: "text/html"
  });

  client.seed(file, function (torrent) {
    console.log('client is seeding ' + torrent.magnetURI);
  });

}

function downloadFromTorrent(hash){
  // Load webpage from torrent
  client.add(hash, function (torrent) {
    torrent.on('noPeers', function(announceType){
      $.bootstrapGrowl("No peers found: ", {type: 'danger'});
    });
    var file = torrent.files[0];
    file.getBlobURL(function (err, url) {
      document.getElementById('site').src = url;
      $('#loading').css('display', 'none');
      file.getBuffer(function (err, buffer){
        buffer = buffer.toString('utf8');
        // Verify the checksum, if it fails, show an alert.
        if (verify(checksum, buffer) == false) {
          alert('Notice: Security check failed. This file may have been tampered with.\n\nThis may just be a quirk, though.\n\nWill stop seeding.');
          client.remove(torrent.magnetURI);
        }
        else {
          fullTest();
          localStorage[hash] = buffer;
        }
      });
    });
  });
}

function verify(checksum, text){
  var bitArray = sjcl.hash.sha256.hash(text);
  var digest_sha256 = sjcl.codec.hex.fromBits(bitArray);

  if (digest_sha256 != checksum){
    return false;
  }
  else{
    return true;
  }
}

function fullTest(){
  try {
    localStorage.setItem('fullTest', '9999999');
  } catch(e) {
    if (e.code == 22) {
      $.bootstrapGrowl("Storage capacity for saving torrents offline is full.", {type: 'danger'});
      return false;
    }
  }
}

}
