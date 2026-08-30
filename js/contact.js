/**
 * @file contact.js
 * @description Handles client-side contact form interactions, math CAPTCHA anti-spam verification,
 * submission rate-limiting, Cloud Firestore database writes, and dynamic page content loading.
 * @project EG1 Website Portal
 */

$(document).ready(function () {
    // Expected answer for the dynamic math CAPTCHA
    var expectedAnswer = 0;
    // Tracks whether user has focused on form inputs to lazy-load the CAPTCHA
    var formAttempted = false;

    /**
     * Generates a random arithmetic problem (addition, subtraction, multiplication)
     * as a simple anti-bot challenge to prevent automated spam submissions.
     */
    function generateCaptcha() {
        var operations = ['+', '-', '*'];
        var op = operations[Math.floor(Math.random() * operations.length)];
        var n1 = Math.floor(Math.random() * 10) + 1;
        var n2 = Math.floor(Math.random() * 10) + 1;

        // Ensure subtraction results in a non-negative integer
        if (op === '-' && n1 < n2) {
            var temp = n1; n1 = n2; n2 = temp;
        }

        $('#num1').text(n1);
        $('#mathOp').text(op);
        $('#num2').text(n2);

        if (op === '+') expectedAnswer = n1 + n2;
        if (op === '-') expectedAnswer = n1 - n2;
        if (op === '*') expectedAnswer = n1 * n2;

        $('#botCheckContainer').show();
        $('#txtbot').val('');
        $('#txtbot').attr('required', true);
    }

    /**
     * Lazy initialization of CAPTCHA on initial user input focus
     * to avoid unnecessary DOM changes for casual visitors.
     */
    $('#contactForm input, #contactForm textarea').on('focus', function () {
        if (!formAttempted) {
            generateCaptcha();
            formAttempted = true;
        }
    });

    /**
     * Contact Form Submission Handler
     * Validates user input, checks math CAPTCHA, enforces 24h client rate-limiting,
     * and persists message payload into Cloud Firestore `/messages` collection.
     */
    $('#contactForm').submit(function (e) {
        e.preventDefault();

        // Enforce 24-hour rate limit via localStorage check
        var lastSent = localStorage.getItem('lastMessageTime');
        if (lastSent && (Date.now() - parseInt(lastSent) < 86400000)) {
            showMessage('You have already sent a message recently. Please try again tomorrow.', 'error');
            return;
        }

        // Sanitize and extract user inputs
        var name = $('#txtname').val().trim();
        var email = $('#txtemail').val().trim();
        var contact = $('#txtcontact').val().trim();
        var message = $('#txtenq').val().trim();
        var botAnswer = parseInt($('#txtbot').val().trim());

        // Verify CAPTCHA answer
        if (botAnswer !== expectedAnswer) {
            showMessage('Incorrect anti-spam answer. Please try again.', 'error');
            generateCaptcha();
            return;
        }

        // Field presence check
        if (!name || !email || !contact || !message) {
            showMessage('Please fill all required fields.', 'error');
            return;
        }

        var btn = $('#btnsend');
        btn.prop('disabled', true).text('Sending...');

        // Write submission to Firestore /messages collection
        // Firestore Security Rules enforce string type, length limits, and server timestamp.
        db.collection("messages").add({
            name: name,
            email: email,
            contact: contact,
            message: message,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
            .then(function (docRef) {
                console.log("Message saved with ID: ", docRef.id);
                localStorage.setItem('lastMessageTime', Date.now().toString());
                showMessage('Thank you for contacting us! We will get back to you shortly.', 'success');
                $('#contactForm')[0].reset();
                formAttempted = false;
                $('#botCheckContainer').hide();
                $('#txtbot').removeAttr('required');
            })
            .catch(function (error) {
                console.error("Error saving message: ", error);
                showMessage('Error sending message. Please try again later.', 'error');
            })
            .finally(function () {
                btn.prop('disabled', false).text('Send Enquiry');
            });
    });

    /**
     * Displays success or error alert banner on the page.
     * @param {string} msg - Feedback message text to display.
     * @param {string} type - Alert type ('success' or 'error').
     */
    function showMessage(msg, type) {
        var msgBox = $('#contactMessage');
        msgBox.removeClass('alert-success alert-danger').show().text(msg);

        if (type === 'success') {
            msgBox.css({ 'background-color': '#d4edda', 'color': '#155724', 'border': '1px solid #c3e6cb' });
        } else {
            msgBox.css({ 'background-color': '#f8d7da', 'color': '#721c24', 'border': '1px solid #f5c6cb' });
        }

        setTimeout(function () {
            msgBox.fadeOut();
        }, 5000);
    }
});

/**
 * Listens for DOM ready to fetch
 * custom page header and body content for the Contact page from static JSON via DataCache.
 */
document.addEventListener("DOMContentLoaded", function () {
    loadContactContent();
});

/**
 * Asynchronously loads dynamic Contact page title and copy from DataCache (data/website_content.json, 0 Firestore reads).
 * Fallbacks to default HTML content if document is missing or fetch fails.
 */
async function loadContactContent() {
    var titleEl = document.getElementById("contactTitleText");
    var contentEl = document.getElementById("contactContentText");

    try {
        var data = await DataCache.getPageContent("contact");
        console.log("Fetched Contact page content:", data);
        if (!data) {
            console.warn("No content found for page 'contact'. Using default static content.");
            return;
        }

        if (data.title && titleEl) {
            titleEl.innerHTML = data.title;
        }

        if (data.content && contentEl) {
            contentEl.innerHTML = data.content;
        }
    } catch (e) {
        console.error("Error loading Contact page content:", e.message);
    }
}

