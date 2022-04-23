export default class Chat {
    constructor() {
        // the openYet property is useful to establish a connection to the server only when the chat is first opened
        this.openedYet = false;
        this.chatWrapper = document.querySelector('#chat-wrapper');
        this.openIcon = document.querySelector('.header-chat-icon');
        this.injectHTML();
        this.closeIcon = document.querySelector('.chat-title-bar-close');
        this.events();
    }

    // Events
    events() {
        // We use arrow function because they do not modify the .this keywork
        this.openIcon.addEventListener('click', () => this.showChat());
        this.closeIcon.addEventListener('click', () => this.hideChat());

    }

    // Methods
    openConnection() {
        alert('opening...')
    }

    showChat() {
        // this will be false only when the chat is first opened
        if(!this.openedYet) {
            this.openConnection();
        }
        this.openedYet = true;
        this.chatWrapper.classList.add('chat--visible');
    }

    hideChat() {
        this.chatWrapper.classList.remove('chat--visible');
    }

    injectHTML() {
        this.chatWrapper.innerHTML = `
        <div class="chat-title-bar">Chat <span class="chat-title-bar-close"><i class="fas fa-times-circle"></i></span></div>
        <div id="chat" class="chat-log"></div>

        <form id="chatForm" class="chat-form border-top">
            <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
        </form>
        `
    }
}