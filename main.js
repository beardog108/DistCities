window.onload = function(){
var root = window.location.protocol + '//' + window.location.host + window.location.pathname.replace('index.html', '');

String.prototype.startsWith = function(needle)
{
    return(this.indexOf(needle) == 0);
};

if (! WebTorrent.WEBRTC_SUPPORT) {
  $('#error').css('display', 'block');
  $('#error').html('<h1 class="center">Your browser does not support WebRTC. You need this!</h1>');
}

var client = new WebTorrent();
var text;
var fileName = 'main.html';
$('#create').click(function(){
  text = $('#data').val();
  if (text == ''){
    return;
  }

  // Construct a file
  var parts = [
    new Blob([text], {type: 'text/html'}),
  ];

  file = new File(parts, fileName, {
      type: "text/html"
  });

  var bitArray = sjcl.hash.sha256.hash(text);
  var digest_sha256 = sjcl.codec.hex.fromBits(bitArray);

  client.seed(file, function (torrent) {
    console.log('client is seeding ' + torrent.magnetURI);
    $('#output').css('display', 'block');
    console.log('Security hash: ' + digest_sha256);
    $('#output').append('<span class="removeTorrent"><button class="btn btn-danger btn-sm" data-infoHash="' + torrent.infoHash + '" >Remove</button> <input type="text" readonly value="' + root + 'view.html#t=' + torrent.infoHash + '&256=' + digest_sha256 + '"><br><br></span>');
    try {
      localStorage.setItem('fullTest', '9999999');
    } catch(e) {
      if (e.code == 22) {
        $.bootstrapGrowl("Storage capacity for saving torrents offline is full.", {type: 'danger'});
        return;
      }
    }
    localStorage.removeItem('fullTest');
    localStorage[torrent.magnetURI] = text;
    torrent.on('wire', function (wire, addr) {
      $.bootstrapGrowl("Connected with peer: " + addr);
    });
  });


});

for (var magnet in localStorage){
  if (magnet.startsWith('magnet:?xt=urn:')){
    loadLocal(magnet);
  }
}

function loadLocal(hash) {
  var text = localStorage[hash];
  // Load webpgae from localStorage cache
  console.log('Loading from cached copy.');

  var data = new Blob([text], {type: 'text/html'});

  var parts = [
    new Blob([text], {type: 'text/html'}),
  ];

  // Construct a file
  var fileName = 'main.html'
  file = new File(parts, fileName, {
      type: "text/html"
  });

  var bitArray = sjcl.hash.sha256.hash(text);
  var digest_sha256 = sjcl.codec.hex.fromBits(bitArray);

  client.seed(file, function (torrent) {
    console.log('client is seeding ' + torrent.magnetURI);
    console.log(digest_sha256);
    $('#output').css('display', 'block');
    $('#output').append('<span class="removeTorrent"><button class="btn btn-danger btn-sm" data-infoHash="' + torrent.infoHash + '" >Remove</button> <input type="text" readonly value="https://chaoswebs.net/distcities/view.html#t=' + torrent.infoHash + '&256=' + digest_sha256 + '"><br><br></span>');
    torrent.on('wire', function (wire, addr) {
      $.bootstrapGrowl("Connected with peer: " + addr);
    });
  });

}

function removeTorrent(hash)
{
  var hash = 'magnet:?xt=urn:btih:' + hash + '&dn=main.html&tr=udp%3A%2F%2Fexodus.desync.com%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com';
  client.remove(hash);
  localStorage.removeItem(hash);
}

$(document).on('click', '.removeTorrent', '.btn', function(event){
    if (event.target.nodeName == 'INPUT')
    {
      $(event.target).select();
      return;
    }
    var hash = event.target.getAttribute('data-infoHash');
    console.log('Recieved command to remove ' + hash);
    removeTorrent(hash);
    event.target.parentNode.remove();
});

}
