import Search from './modules/search';
import Chat from './modules/chat';
import RegistrationForm from './modules/registrationForm';

// if the registration form exists on the current page
if(document.querySelector('#registration-form')) new RegistrationForm();

// only if the user is logged in and therefore the Chat exists, execute the Chat object
if(document.querySelector('#chat-wrapper')) new Chat();

// only if the user is logged in and therefore the Search exists, execute the Search object
if(document.querySelector('.header-search-icon')) new Search();