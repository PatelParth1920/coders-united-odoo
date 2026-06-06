function previewImage(event) {
    const reader = new FileReader();
    reader.onload = function() {
        const preview = document.getElementById('image-preview-element');
        const defaultIcon = document.getElementById('default-upload-icon-container');
        preview.src = reader.result;
        preview.style.display = 'block';
        if (defaultIcon) {
            defaultIcon.style.display = 'none';
        }
    }
    if (event.target.files[0]) {
        reader.readAsDataURL(event.target.files[0]);
    }
}

function checkWordLimit(textarea) {
    const words = textarea.value.trim().split(/\s+/).filter(word => word.length > 0);
    document.getElementById('word-count-val').innerText = words.length;
    
    if (words.length > 150) {
        // Trim value to exactly 150 words
        const trimmedWords = words.slice(0, 150);
        textarea.value = trimmedWords.join(' ');
        document.getElementById('word-count-val').innerText = 150;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('detailed-register-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('reg-email').value;
            const phone = document.getElementById('reg-phone').value;
            const errorBox = document.getElementById('error-message-box');
            
            errorBox.style.display = 'none';
            errorBox.innerText = '';

            // 1. Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Invalid Email Address! Please input a valid corporate email address.');
                errorBox.innerText = 'Invalid Email Address!';
                errorBox.style.display = 'block';
                return;
            }

            // 2. Phone validation (Remove non-digits for length test)
            const cleanPhone = phone.replace(/\D/g, '');
            if (cleanPhone.length < 10) {
                alert('number is invalide less than 10 number');
                errorBox.innerText = 'number is invalide less than 10 number';
                errorBox.style.display = 'block';
                return;
            } else if (cleanPhone.length > 10) {
                alert('invalid number more than 10 numbers please try again');
                errorBox.innerText = 'invalid number more than 10 numbers please try again';
                errorBox.style.display = 'block';
                return;
            }

            // If success
            alert('Registration Successful! Your partner application is under verification review.');
            window.location.href = 'index.html';
        });
    }
});

