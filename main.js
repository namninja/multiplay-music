'use strict';
const SONGSTERR_URL = `http://www.songsterr.com/a/ra/songs/byartists.json?artists=`;
const SONG_INSTRUCTION_URL = `http://www.songsterr.com/a/wa/song?id=`;
const YOUTUBE_KEY = 'AIzaSyClU_CyBAIHdrxQZz1btz2NhFMn_JYg7oI'; 
const YOUTUBE_URL = 'https://www.googleapis.com/youtube/v3/search';
const search = {
    nextPageToken: '',
    searchTerms: '',
    totalResults: 0
  }
// -------------------------------------------------------------------------------
// These functions are related to the YouTube API

// listen for more button event
function handleMoreVideos() {
    // listen for event
    $('.js-next-form').on('click', '.js-next-results', (event) => {
      // override default behavior
      event.preventDefault();
      // log event
      console.log('handleMoreVideos ran')
      getYouTubeVideos(search.searchTerms);
    })
  }

function formatQueryParams(params) {
    const queryItems = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    return queryItems.join('&');
  }



  function renderResult(result) {
    console.log(result);
    return `
    <div class="col-6 js-video-thumb video-thumb">
      <div class="js-video-thumb video-thumb">
        <a href="https://www.youtube.com/watch?v=${result.id.videoId}">
          <img src="${result.snippet.thumbnails.medium.url}" class="thumbnail-image" alt="${result.snippet.title}">
        </a>
        <p class="video-title">${result.snippet.title}</p>
      </div>
    </div>
  `;
  }

  function displayVideoResults(data) {
    console.log('displayVideoResults ran');
    // sets next page token value for more searches
  search.nextPageToken = data.nextPageToken
  // sets total results to be displayed
  search.totalResults = data.pageInfo.totalResults
  console.log(search.totalResults)
  // if no results, displays error 
  if (search.totalResults === 0) {
  $('.js-videos-heading').html('No Results, Please try again');
  $('.js-videos-results').html('');
  $('.js-next-results').addClass('hidden');
  } else {
  console.log(search.nextPageToken)
  // loop through data and render data as html
  const results = data.items.map((item, index) => renderResult(item));
  // manipulate DOM to display results
  $('.video-results').attr('aria-hidden', false);
  $('.js-results-heading').removeClass('hidden');
   $('.js-results-heading').html('Results: '+ search.totalResults+' total videos with '+ search.searchTerms);
  $('.js-next-results').removeClass('hidden');
  $('.js-video-results').html(results);
  $('.loading').addClass('hidden');
  $('.js-videos').removeClass('hidden')
  }
}

function getYouTubeVideos(query) {
    console.log('getYouTubeVideos ran');
    const params = {
      key: YOUTUBE_KEY,
      q: query,
      part: 'snippet',
      maxResults: '2',
      type: 'video',
      pageToken: search.nextPageToken
    };
    const queryString = formatQueryParams(params)
    const url = YOUTUBE_URL + '?' + queryString;
  
    console.log(url);
  
    fetch(url)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(response.statusText);
      })
      .then(responseJson => displayVideoResults(responseJson))
      .catch(err => {
        displayYouTubeError(err.message);
    });
}
function displayYouTubeError(error) {
    console.log('displayError ran');
    $('.js-videos').html(`<h3 class="error">Something went wrong: ${error}</h3>`)
    $('.loading').addClass('hidden');
    $('.js-videos').removeClass('hidden')
}
  

function watchSongForm() {
    console.log('watchSongForm ran')
    //Listens for submit event
    $('.js-song-search').on('submit', '.js-song-search-form', event => {
        //override default behavior
        event.preventDefault();
        //store user's selected value 
        let artist = $('#search-artist').val()
        console.log(artist)
        let song = $('#song-library').val()
        console.log(song)
        let songId = $('option').attr('val')
        console.log(songId)
        displayTablature(songId)
        let query = artist + ' ' + song
        console.log(query)
        search.nextPageToken = ''
        search.searchTerms = query
        $('.loading').removeClass('hidden');
        getYouTubeVideos(query)
    });
}


// -------------------------------------------------------------------------------
// These functions are related to the Songsterr API

function displayTablature(songId) {
    console.log('displayTablature ran')
    const url = `${SONG_INSTRUCTION_URL}${songId}`
    console.log(url)
    $('.js-tab-display').attr('src', url)
    $('.js-tablature').removeClass('hidden')
}


function dynamicSort(property) {
    console.log('dynamicSort ran');
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        if(sortOrder == -1){
            return b[property].localeCompare(a[property]);
        }else{
            return a[property].localeCompare(b[property]);
        }        
    }
}

function generateSongLibrary(data) {
    console.log('generateSongLibrary ran')
    const songList = data.sort(dynamicSort("title"));
    let select = '';
    //use for loop to create options 1-50 to be rendered as html
    for (let i = 0; i < songList.length; i++) {
        select += '<option val=' + songList[i].id + '>' + songList[i].title + '</option>';
    }
    //add html to DOM
    let songLibrary = `
    <form class="js-song-search-form song-search-form">
                <select name="song-library" id="song-library">
                 ${select}   
                </select>
                <button class="search-song-btn" type="submit">Let's Learn</button>
            </form>
    `
    $('.js-song-search').html(songLibrary);
    $('.loading').addClass('hidden');
    $('.js-song-search').removeClass('hidden')
}


function displaySongError() {
    console.log('displayError ran');
    $('.js-song-search').html(`<h5 class="error">Sorry, there are no available songs for this artist.</h5>`)
    $('.loading').addClass('hidden');
    $('.js-song-search').removeClass('hidden')
}

function getAvailableSongs(artist) {
    console.log('getAvailableSongs ran')
    let artistQuery = `"${encodeURIComponent(artist)}"`
    const url = SONGSTERR_URL + artistQuery;
    console.log(url)
    fetch(url)
        //if repsonse is good, returns results in JSON format
        .then(response => response.json())
        //Pass the object as a parameter to the displayResults function
        .then(responseJson => {
            if (responseJson.length > 0) {
                generateSongLibrary(responseJson)
            }
            else { 
                displaySongError()
            }
        })
      
}
// -------------------------------------------------------------------------------

//Event listener for submit event
function watchArtistForm() {
    console.log('watchArtistForm ran')
    //Listens for submit event
    $('.js-search-artist-form').submit(event => {
        $('.js-song-search').addClass('hidden')
        $('.js-videos').addClass('hidden')
        //override default behavior
        event.preventDefault();
        //store user's selected value 
        let artist = $('#search-artist').val()
        console.log(artist)
        $('.loading').removeClass('hidden');
        getAvailableSongs(artist)
    });
}







$(function () {
    console.log('App loaded! Waiting for submit!');
    
    watchArtistForm();
    watchSongForm();
    handleMoreVideos()
});