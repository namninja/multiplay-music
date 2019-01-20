// https://cors-anywhere.herokuapp.com/

'use strict';

//These are the end points for the API calls 
const SONGSTERR_URL = `https://cors-anywhere.herokuapp.com/http://www.songsterr.com/a/ra/songs/byartists.json?artists=`;
const SONG_INSTRUCTION_URL = `http://www.songsterr.com/a/wa/song?id=`;
const YOUTUBE_KEY = 'AIzaSyClU_CyBAIHdrxQZz1btz2NhFMn_JYg7oI';
const YOUTUBE_URL = 'https://www.googleapis.com/youtube/v3/search';
const MUSIXMATCH_KEY = 'e59d18fa14460230b008ccc103aabab8';
const MUSIXMATCH_ARTIST_URL = 'https://cors-anywhere.herokuapp.com/http://api.musixmatch.com/ws/1.1/track.search';
const MUSIXMATCH_TRACK_URL = 'https://cors-anywhere.herokuapp.com/http://api.musixmatch.com/ws/1.1/track.lyrics.get';

//This is search data for youTube API to be used in "More Results" functionality
const search = {
    nextPageToken: '',
    searchTerms: '',
    totalResults: 0
}
//This is search data that is used globally
const searchData = {
    currentArtist: null,
    currentSong: null,
    trackID: null,
    trackURL: null

}
// -------------------------------------------------------------------------------
// These functions are related to the Musixmatch API


//Construct HTML to be displayed in dropdown in DOM 
function renderLyrics(lyrics, copyright) {
    console.log('renderLyrics ran');
    //replaces /n with <br> to display properly
    let revisedLyrics = lyrics.replace(/(?:\r\n|\r|\n)/g, '<br>')
    return `
    <a class="lyrics-link" href="${searchData.trackURL}" target="_blank">
    <div class="lyrics-snippet">${revisedLyrics}</div>
    </a>
    <div class="copyright">
    ${copyright}
    </div>
    `
}

//Displays lyrics in DOM
function displayLyrics(data) {
    console.log('displayLyrics ran');
    console.log(data)
    //Store lyrics data
    const lyricsTarget = data.message.body.lyrics
    let lyricsData = lyricsTarget.lyrics_body
    console.log(lyricsData)
    //store copyright data
    let copyright = lyricsTarget.lyrics_copyright
    console.log(copyright)
    //pass lyrics and copyright to be rendered into HTML
    let lyricsSnippet = renderLyrics(lyricsData, copyright)
    //display results in DOM
    $('.js-lyrics-results').html(lyricsSnippet)
    $('.loading').addClass('hidden');
    $('.js-lyrics').removeClass('hidden')

}

//Fetches data from MusicxMatch API using track.lyrics.get method, converts and passes data to be displayed in DOM
function getLyrics(id) {
    console.log('getLyrics ran');
    //Initate parameters for API call
    const params = {
        track_id: id,
        apikey: MUSIXMATCH_KEY
    };
    //format parameters to be used in URL
    const queryString = formatQueryParams(params)
     //construct URL for API call
    const url = MUSIXMATCH_TRACK_URL + '?' + queryString;

    console.log(url);
    //Asynchronous request to MusixMatch API
    fetch(url)
    //if repsonse is good, returns results in JSON format
        .then(response => {
            if (response.ok) {
                console.log('ok')
                return response.json();
            }
             //if reponse is not ok,then throw an error
            throw new Error(response.statusText);
        })
        //if reponse is ok, then we pass the JSON results into displayLyrics to be rendered in DOM
        .then(responseJson => displayLyrics(responseJson))
        //if reponse is not ok, then the error we threw will be passed as a parameter in the displayError function and rendered in DOM
        .catch(err => {
            zeroResultsError(err.message);
        });
}

//Function finds trackID by finding the closest match
function findTrackID(numResults, trackList) {
    //If there are no results, then display zero result error
    if (numResults === 0) {
        zeroResultsError();
    }
    else {
        //if there are results, loop through and find trackId with matching Artist and Song
        for (let i = 0; i < trackList.length; i++) {
            let trackName = trackList[i].track.track_name
            //replace any punctuation using regex
            trackName = trackName.replace(/[^A-Za-z0-9_]/g, "")
            let artistName = trackList[i].track.artist_name
            let currentSong = searchData.currentSong
            currentSong = currentSong.replace(/[^A-Za-z0-9_]/g, "")
            let currentArtist = searchData.currentArtist
            //normalize the data to lowercase and look for exact matches
            if ((trackName.toLowerCase() == currentSong.toLowerCase()) && (artistName.toLowerCase() == currentArtist.toLowerCase())) {
                searchData.trackID = trackList[i].track.track_id
                searchData.trackURL = trackList[i].track.track_share_url
            }
            //if there are no matches, then return zeroResults error
            else {
                zeroResultsError;
            }
            
        }
    }
}

//get the trackID and pass it to getLyrics to make another API call
function getTrackID(data) {
    console.log('getTrackID ran');
    console.log(data)
    console.log(data.message.header.available)
    //get the number of results
    let numResults = data.message.header.available
    //get the artist data and track matches
    let trackList = data.message.body.track_list
    //find closest track match 
    findTrackID(numResults, trackList)
    //log result
    console.log(searchData.trackID)
    console.log(searchData.trackURL)
    //use trackID to get lyrics
    getLyrics(searchData.trackID);
}

//Fetches data from MusixMatch API and searches by Artist and Song to find trackID
function getTrackData(artist, song) {
    console.log('getTrackData ran');
    //Initate parameters for API call
    const params = {
        q_artist: artist,
        q_track: song,
        page_size: 100,
        page: 1,
        s_track_rating: 'desc',
        apikey: MUSIXMATCH_KEY
    };
    //format parameters to be used in URL
    const queryString = formatQueryParams(params)
    //construct URL for API call
    const url = MUSIXMATCH_ARTIST_URL + '?' + queryString;
    console.log(url);
    //Asynchronous request to MusixMatch API
    fetch(url)
        //if repsonse is good, returns results in JSON format
        .then(response => {
            if (response.ok) {
                console.log('ok')
                return response.json();
            }
            //if reponse is not ok,then throw an error
            throw new Error(response.statusText);
        })
        //if reponse is ok, then we pass the JSON results into getTRackID to be rendered in DOM
        .then(responseJson => getTrackID(responseJson))
        .catch(err => {
            //if reponse is not ok, then the error we threw will be passed as a parameter in the displayError function and rendered in DOM
            zeroResultsError(err.message);
        });
}

//diplays error to DOM if there are no lyrics. The function takes an error as a parameter
//but it is not used since failure of API is most likely due to no lyrics found.
function zeroResultsError() {
    console.log('zeroResultsError ran');
    $('.js-lyrics-results').html(`<h4 class="error">Sorry, no lyrics found</h4>`)
    $('.js-lyrics').removeClass('hidden')
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


//formats and encodes parameter to adhere to API request
function formatQueryParams(params) {
    const queryItems = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    return queryItems.join('&');
}


//Renders the video results as HTML
function renderVideoResult(result) {
    console.log(result);
    return `
      <div class="js-video-container video-container">
        <a href="https://www.youtube.com/watch?v=${result.id.videoId}" target="_blank">
          <img class="video-thumb" src="${result.snippet.thumbnails.high.url}" class="thumbnail-image" alt="${result.snippet.title}">
        </a>
        <p class="video-title">${result.snippet.title}</p>
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
        const results = data.items.map((item, index) => renderVideoResult(item));
        // manipulate DOM to display results
        $('.video-results').attr('aria-hidden', false);
        $('.js-results-heading').removeClass('hidden');
        $('.js-results-heading').html('Results: ' + search.totalResults + ' total videos with ' + search.searchTerms);
        $('.js-next-results').removeClass('hidden');
        $('.js-video-results').html(results);
        $('.loading').addClass('hidden');
        $('.js-videos').removeClass('hidden')
    }
}

//Fetches data from API, converts and passes data to be displayed in DOM
function getYouTubeVideos(query) {
    console.log('getYouTubeVideos ran');
    //Initate parameters for API call
    const params = {
        key: YOUTUBE_KEY,
        q: query,
        part: 'snippet',
        maxResults: '2',
        type: 'video',
        pageToken: search.nextPageToken
    };
    //format parameters to be used in URL
    const queryString = formatQueryParams(params)
    //construct URL for API call
    const url = YOUTUBE_URL + '?' + queryString;

    console.log(url);
    //Asynchronous request to youtube API
    fetch(url)
        //if repsonse is good, returns results in JSON format
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            //if reponse is not ok,then throw an error
            throw new Error(response.statusText);
        })
        //if reponse is ok, then we pass the JSON results into displayVideoResults to be rendered in DOM
        .then(responseJson => displayVideoResults(responseJson))
        //if reponse is not ok, then the error we threw will be passed as a parameter in the displayError function and rendered in DOM
        .catch(err => {
            displayYouTubeError(err.message);
        });
}

//Takes thrown error as parameter and displays in DOM
function displayYouTubeError(error) {
    console.log('displayError ran');
    $('.js-videos').html(`<h4 class="error">Something went wrong: ${error}</h4>`)
    $('.js-videos').removeClass('hidden')
}

//Resets the Search Data and hides results if the user chooses a different song of the same artist
function resetSongResults() {
    console.log('resetSongResults ran')
    searchData.currentSong = null
    searchData.trackID = null
    searchData.trackURL = null
    search.nextPageToken = ''
    $('.js-lyrics').addClass('hidden')
    $('.js-lyrics-results').empty();
}

//Event listener for button submission for the song user wishes to learn
function watchSongForm() {
    console.log('watchSongForm ran')
    //Listens for submit event
    $('.js-song-search').on('submit', '.js-song-search-form', event => {
        //override default behavior
        event.preventDefault();
        resetSongResults();
        //store user's selected values 
        let song = $('#song-library').val()
        searchData.currentSong = song
        console.log(song)
        //store songID from dropdown selection
        let songId = $('option:selected').attr('val')
        console.log(songId)
        //pass songID into displayTablature to prepare results
        displayTablature(songId)
        //construct query
        let query = searchData.currentArtist + ' ' + searchData.currentSong
        console.log(query)
        search.searchTerms = query
        //display loading animation
        $('.loading').removeClass('hidden');
        //fetch youtube data
        getYouTubeVideos(query)
        //fetch lyric data from musixmatch
        getTrackData(searchData.currentArtist, searchData.currentSong)
    });
}


// -------------------------------------------------------------------------------
// These functions are related to the Songsterr API

//This function renders the the HTML for the tablature link
function renderTablature(url) {
    console.log('renderTablature ran')
    return `
        <h3 class="headings">Learn to play at Songsterr</h3>
        <div class="tab">
        <a class="tab-link" href='${url}' target="_blank"><img id="tab-img" src="images/tablature.png" alt="tablature">
        <p>${searchData.currentSong}</p></a>
        </div>
    `
}

//This function takes the song ID based on the users option selection and constructs a link to the tablature in the Songsterr webpage
function displayTablature(songId) {
    console.log('displayTablature ran')
    //construct URL
    const url = `${SONG_INSTRUCTION_URL}${songId}`
    console.log(url)
    //render the link into HTML to be displayed in DOM
    const songInstruction = renderTablature(url);
    //Add results to DOM
    $('.js-tablature').html(songInstruction)
    $('.js-tablature').removeClass('hidden')
}

//This function is used to sort the song list alphabetically
function dynamicSort(property) {
    console.log('dynamicSort ran');
    var sortOrder = 1;
    if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a, b) {
        if (sortOrder == -1) {
            return b[property].localeCompare(a[property]);
        } else {
            return a[property].localeCompare(b[property]);
        }
    }
}

//Construct HTML to be displayed in dropdown in DOM 
function renderSongResults(options) {
    console.log('renderSongResults ran')
    return `
    <form class="js-song-search-form song-search-form">
                <label id="artist-search-label" for="search-artist">
                    Find a Song
                </label>
                <select name="song-library" id="song-library">
                 ${options}   
                </select>
                <button class="search-song-btn" type="submit">Let's Learn</button>
            </form>
    `
}

//Use JSON Data to create a Select Options Dropdown to display song results
function generateSongLibrary(data) {
    console.log('generateSongLibrary ran')
    //Sort the songs alphabetically
    const songList = data.sort(dynamicSort("title"));
    let select = '';
    //use for loop to create options 1-50 to be rendered as html
    for (let i = 0; i < songList.length; i++) {
        select += '<option class="song-option" val=' + songList[i].id + '>' + songList[i].title + '</option>';
    }
    //contruct html for 
    let songLibrary = renderSongResults(select)
    //add html to DOM
    $('.js-song-search').html(songLibrary);
    $('.loading').addClass('hidden');
    $('.js-song-search').removeClass('hidden')
}

//Displays an error if there are no songs found due to user error or artist is not in API
function displaySongError() {
    console.log('displayError ran');
    $('.js-song-search').html(`<h4 class="error">Sorry, there are no available songs for this artist.</h4>`)
    $('.loading').addClass('hidden');
    $('.js-song-search').removeClass('hidden')
}

//This function takes artist as a parameter and builds a query to gather a list of songs from the Songster API
function getAvailableSongs(artist) {
    console.log('getAvailableSongs ran')
    //take artist name and encode it for the query
    let artistQuery = `"${encodeURIComponent(artist)}"`
    //construct API URL
    const url = SONGSTERR_URL + artistQuery;
    console.log(url)
    //fetch data from API
    fetch(url)
        //if repsonse is good, returns results in JSON format
        .then(response => response.json())
        // If the artist exists in the library, pass the object as a parameter to the generateSongLibrary function
        .then(responseJson => {
            if (responseJson.length > 0) {
                generateSongLibrary(responseJson)
            }
            //if the artist is not in the API or the user mispelled the name, an error will display
            else {
                displaySongError()
            }
        })

}
// -------------------------------------------------------------------------------

//This function restores current search data when user wants to search for a new artist and song
function resetData() {
    console.log('resetData ran')
    // assign null values to search data object
    searchData.currentArtist = null
    searchData.currentSong = null
    searchData.trackID = null
    searchData.trackURL = null
}

// This function hides the results sections at the start of the search by adding hidden class
function hideResults() {
    console.log('hideResults ran')
    $('.js-song-search').addClass('hidden')
    $('.js-videos').addClass('hidden')
    $('.js-tablature').addClass('hidden')
    $('.js-lyrics').addClass('hidden')
}

//Event listener for submit event
function watchArtistForm() {
    console.log('watchArtistForm ran')
    //Listens for submit event
    $('.js-search-artist-form').submit(event => {
        //override default behavior
        event.preventDefault();
        //reset the current serach data
        resetData();
        //hide the results sections 
        hideResults()
        //store user's selected value 
        let artist = $('#search-artist').val()
        searchData.currentArtist = artist
        console.log(artist)
        //instead of completely clearing the input, store it as a placeholder
        $('#search-artist').attr("placeholder", artist)
        $('#search-artist').val("")
        // run loading animation
        $('.loading').removeClass('hidden');
        //fetch song data from Songsterr API
        getAvailableSongs(artist)
    });
}







$(function () {
    console.log('App loaded! Waiting for submit!');
    watchArtistForm();
    watchSongForm();
    handleMoreVideos()
});