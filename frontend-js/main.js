import Search from './modules/search';
import Chat from './modules/chat';

// only if the user is logged in and therefore the Chat exists, execute the Chat object
if(document.querySelector('#chat-wrapper')) new Chat();

// only if the user is logged in and therefore the Search exists, execute the Search object
if(document.querySelector('.header-search-icon')) new Search();