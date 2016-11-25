var CLIENT_ID = '{{db_clientid}}';
// Parses the url and gets the access token if it is in the urls hash
function getAccessTokenFromUrl() {
  return utils.parseQueryString(window.location.hash).access_token;
}
// If the user was just redirected from authenticating, the urls hash will
// contain the access token.
function isAuthenticated() {
  return !!getAccessTokenFromUrl();
}
// Render a list of items to #files
function renderItems(items) {
  var filesContainer = document.getElementById('files');
  items.forEach(function(item) {
    var li = document.createElement('li');
    li.innerHTML = item.name;
    filesContainer.appendChild(li);
  });
}
// This example keeps both the authenticate and non-authenticated sections
// in the DOM and uses this function to show/hide the correct section.
function showPageSection(elementId) {
  document.getElementById(elementId).style.display = 'block';
}

function bootupServer(token) {
  console.log('boot server...');
  $.post('/system/dbinit/' + token, {})
    .done(function(resp) {
      console.log('response', resp);
    });
}

var storageAPI = {
  isSupported: function() {
    return window.localStorage;
  },

  setItem: function(key, value) {
    return localStorage.setItem(key, value);
  },

  getItem: function(key) {
    return localStorage.getItem(key);
  },

  setObject: function(key, object) {
    return localStorage.setItem(key, JSON.stringify(object));
  },

  getObject: function(key) {
    return JSON.parse(localStorage.getItem(key));
  },

  removeItem: function(key) {
    return localStorage.removeItem(key);
  }
};

// no jquery
//$(document).ready(function() {
//  if(!storageAPI.isSupported()) {
//    alert('no session storage support');
//  } else {
//    alert('storing session...');
//  }
//});

window.onload = function() {
  if(!storageAPI.isSupported()) {
    alert('no local storage support');
  } else {
    console.log('local storage supported');
    var storedToken = storageAPI.getItem('token');
    console.log('found storedToken: ', storedToken);

    if(storedToken) {
      bootupServer(storedToken);
    } else if(isAuthenticated()) {
      storedToken = getAccessTokenFromUrl();
      storageAPI.setItem('token', storedToken);
      bootupServer(storedToken);
    }
  }
};

if (isAuthenticated()) {
  showPageSection('authed-section');
  // Create an instance of Dropbox with the access token and use it to
  // fetch and render the files in the users root directory.
  var dbx = new Dropbox({ accessToken: getAccessTokenFromUrl() });
  dbx.filesListFolder({path: ''})
    .then(function(response) {
      renderItems(response.entries);
    })
    .catch(function(error) {
      console.error(error);
    });
} else {
  showPageSection('pre-auth-section');
  // Set the login anchors href using dbx.getAuthenticationUrl()
  var dbx = new Dropbox({ clientId: CLIENT_ID });
  var authUrl = dbx.getAuthenticationUrl('{{authentication_url}}');
  document.getElementById('authlink').href = authUrl;
}
