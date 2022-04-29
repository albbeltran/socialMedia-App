import axios from 'axios';

export default class RegistrationForm {
    constructor() {
        // select the csrf token to use it on the axios requests
        this._csrf = document.querySelector('[name="_csrf"').value
        this.form = document.querySelector('#registration-form');
        this.allFields = document.querySelectorAll('#registration-form .form-control');
        this.insertValidationElements();
        this.username = document.querySelector('#username-register');
        this.username.previousValue = '';
        this.email = document.querySelector('#email-register');
        this.email.previousValue = '';
        this.password = document.querySelector('#password-register');
        this.password.previousValue = '';
        this.username.isUnique = false;
        this.email.isUnique = false;
        this.events();
    }

    // Events
    events () {
        this.form.addEventListener('submit', e => {
            e.preventDefault();
            this.formSubmitHandler();
        });

        this.username.addEventListener('keyup', () => {
            this.isDifferent(this.username, this.usernameHandler);
        });

        this.email.addEventListener('keyup', () => {
            this.isDifferent(this.email, this.emailHandler);
        });
        
        this.password.addEventListener('keyup', () => {
            this.isDifferent(this.password, this.passwordHandler);
        });

        //? the blur event listens when the user focuses on a field
        // this is very important because some users could press tab key to change the field before the errors appear
        this.username.addEventListener('blur', () => {
            this.isDifferent(this.username, this.usernameHandler);
        });

        this.email.addEventListener('blur', () => {
            this.isDifferent(this.email, this.emailHandler);
        });
        
        this.password.addEventListener('blur', () => {
            this.isDifferent(this.password, this.passwordHandler);
        });
    }

    // Methods

    // Avoid to submit the form without values
    formSubmitHandler() {
        this.usernameImmediately();
        this.usernameAfterDelay();
        this.emailAfterDelay();
        this.passwordImmediately();
        this.passwordAfterDelay();

        if
        (
            this.username.isUnique &&
            !this.username.errors && 
            this.email.isUnique &&
            !this.email.errors &&
            !this.password.errors
        ) {
            this.form.submit();
        }
    }

    isDifferent(field, handler) {
        if(field.previousValue != field.value) {
            // point the this keyword to be the overall object instead of the global object because handler() is not a method, but a function of the global object
            handler.call(this);
        }
        field.previousValue = field.value;
    }

    // this is going to run after every keystroke that changes the field's value
    usernameHandler() {
        // each time the user press a keystroke we clean the errors
        this.username.errors = false;
        this.usernameImmediately();
        // reset the Timeout after every keystroke
        clearTimeout(this.username.timer);
        // create a new property on the username property
        this.username.timer = setTimeout(() => this.usernameAfterDelay(), 3000);
    }

    // this is going to run after every keystroke that changes the field's value
    emailHandler() {
        // each time the user press a keystroke we clean the errors
        this.email.errors = false;
        // reset the Timeout after every keystroke
        clearTimeout(this.email.timer);
        // create a new property on the username property
        this.email.timer = setTimeout(() => this.emailAfterDelay(), 5000);
    }

    // this is going to run after every keystroke that changes the field's value
    passwordHandler() {
        // each time the user press a keystroke we clean the errors
        this.password.errors = false;
        this.passwordImmediately();
        // reset the Timeout after every keystroke
        clearTimeout(this.password.timer);
        // create a new property on the username property
        this.password.timer = setTimeout(() => this.passwordAfterDelay(), 3000);
    }

    usernameImmediately() {
        // regular expression to check if the username is alphanumeric
        if(this.username.value != '' && !/^([a-zA-Z0-9]+)$/.test(this.username.value)) {
            this.showValidationError(this.username, 'Username can only contain letters and numbers.');
        }

        if(this.username.value.length > 30) {
            this.showValidationError(this.username, 'Username cannot exceed 30 characters.');
        }

        // if there are no errors
        if(!this.username.errors) {
            this.hideValidationError(this.username);
        }
    }

    passwordImmediately() {
        if(this.password.value.length > 50) {
            this.showValidationError(this.password, 'Password cannot exceed 50 characters.');
        }

        if(this.password.errors) {
            this.hideValidationError(this.password);
        }
    }

    usernameAfterDelay() {
        if(this.username.value.length < 3) {
            this.showValidationError(this.username, 'Username must be at least 3 characters.');
        }

        if(!this.username.errors) {
            axios.post('/doesUsernameExist', {_csrf: this._csrf, username: this.username.value})
            .then((response) => {
                // if the username exists it will be true
                if(response.data) {
                    this.showValidationError(this.username, 'That username is already taken');
                    this.username.isUnique = false;
                } else {
                    this.username.isUnique = true;
                }
            })
            .catch(() => {
                console.log('Please try again later.');
            });
        }
    }

    emailAfterDelay() {
        // regular expression to check if the email is alphanumeric
        if(!/^\S+@\S+$/.test(this.email.value)) {
            this.showValidationError(this.email, 'You must provide a valid email adress.');
        }

        // if there are no errors, send the request
        if(!this.email.errors) {
            axios.post('/doesEmailExist', {_csrf: this._csrf, email: this.email.value})
            .then((response) => {
                // if the email exists it will be true
                if(response.data) {
                    this.email.isUnique = false;
                    this.showValidationError(this.email, 'That email is already being used.');
                } else {
                    this.email.isUnique = true;
                    this.hideValidationError(this.email);
                }
            })
            .catch(() => {
                console.log('Please try again later');
            })
        }
    }

    passwordAfterDelay() {
        if(this.password.value.length < 12) {
            this.showValidationError(this.password, 'Password must be at least 12 characters.');
        }
    }

    showValidationError(field, message) {
        // use nextElementSibling to select the errors' space to show them
        console.log(field.nextElementSibling)
        field.nextElementSibling.innerHTML = message;
        field.nextElementSibling.classList.add('liveValidateMessage--visible');
        // we set a new property to  the field to check if there are errors
        field.errors = true;
    }

    hideValidationError(field) {
        field.nextElementSibling.classList.remove('liveValidateMessage--visible');
    }

    insertValidationElements() {
        this.allFields.forEach(function(field) {
            field.insertAdjacentHTML('afterend', '<div class="alert alert-danger small liveValidateMessage"></div>');
        })
    }
}