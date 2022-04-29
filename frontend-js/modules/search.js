import axios from 'axios';
import DOMPurify from 'dompurify';

export default class Search {
    // 1. Select DOM elements, and keep track of any useful data
    constructor() {
        // select the csrf token to use it on the axios requests
        this._csrf = document.querySelector('[name="_csrf"').value
        this.injectHTML()
        this.headerSearchIcon = document.querySelector('.header-search-icon');
        this.overlay = document.querySelector('.search-overlay');
        this.closeIcon = document.querySelector('.close-live-search');
        this.inputField = document.querySelector('#live-search-field');
        this.resultsArea = document.querySelector('.live-search-results');
        this.loaderIcon = document.querySelector('.circle-loader');
        this.typingWaitTimer;
        this.previousValue = '';
        // the listening begins as soon as the object is created
        this.events();
    }

    // 2. Events 
    events() {
        // when click the search icon
        this.headerSearchIcon.addEventListener('click', (e) => {
            e.preventDefault();
            this.openOverlay();
        })

        // when click the search close icon
        this.closeIcon.addEventListener('click', () => this.closeOverlay());

        // when type a key on the search bar, show the loading icon
        this.inputField.addEventListener('keyup', () => this.keyPressHandler());

    }

    // 3. Methods
    openOverlay() {
        this.overlay.classList.add('search-overlay--visible');
        // place the user's cursor in the search field
        // through a 50ms setTimeout because some browsers could not load focus() immediately
        setTimeout(() => this.inputField.focus(), 50);
    }

    closeOverlay() {
        this.overlay.classList.remove('search-overlay--visible');
    }

    keyPressHandler() {
        let value = this.inputField.value;

        if(value == '') {
          clearTimeout(this.typingWaitTimer);
          this.hideLoaderIcon();
          this.hideResulsArea();
        }

        if(value != '' && value != this.previousValue) {
            clearTimeout(this.typingWaitTimer);
            this.showLoaderIcon();
            this.hideResulsArea();
            // wait after the user has stopped typing, to send the request and save unnecessary requests
            this.typingWaitTimer = setTimeout(() => this.sendRequest(), 750);
        }

        this.previousValue = value;
    }

    sendRequest() {
        axios.post('/search', {
            _csrf: this._csrf,
            searchTerm: this.inputField.value
        })
        .then((response) => {
          console.log(response.data)
          this.renderResultsHTML(response.data);
        })
        .catch(() => {
            alert('hello, the request failed.');
        })
    }

    renderResultsHTML(posts) {
      // if the array has items (posts) we want to display them
      if(posts.length) {
        this.resultsArea.innerHTML = DOMPurify.sanitize(`<div class="list-group shadow-sm">
          <div class="list-group-item active"><strong>Search Results</strong> (${posts.length > 1 ? `${posts.length} items found` : `1 item found`})</div>
          
          ${posts.map((post) => {
            let postDate = new Date(post.createdDate);
            return `<a href="/post/${post._id}" class="list-group-item list-group-item-action">
              <img class="avatar-tiny" src="${post.author.avatar}"> <strong>${post.title}</strong>
              <span class="text-muted small">by ${post.author.username} on ${postDate.getMonth()+1}/${postDate.getDate()}/${postDate.getFullYear()}</span>
            </a>`
          }).join('')}
          
        </div>`)
      } else {
        this.resultsArea.innerHTML = '<p class="alert alert-danger text-center shadow-sm">Sorry, we could not find any results for that search';
      }
      // hide the load icon
      this.hideLoaderIcon();
      this.showResulsArea();
    }

    showLoaderIcon() {
        this.loaderIcon.classList.add('circle-loader--visible');
    }

    hideLoaderIcon() {
      this.loaderIcon.classList.remove('circle-loader--visible');
    }

    showResulsArea() {
      this.resultsArea.classList.add('live-search-results--visible')
    }

    hideResulsArea() {
      this.resultsArea.classList.remove('live-search-results--visible')
    }

    injectHTML() {
        document.body.insertAdjacentHTML('beforeend', `
        <div class="search-overlay">
          <div class="search-overlay-top shadow-sm">
            <div class="container container--narrow">
              <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>
              <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">
              <span class="close-live-search"><i class="fas fa-times-circle"></i></span>
            </div>
          </div>
      
          <div class="search-overlay-bottom">
            <div class="container container--narrow py-3">
              <div class="circle-loader"></div>
              <div class="live-search-results"></div>
            </div>
          </div>
        </div>`);
    }
}