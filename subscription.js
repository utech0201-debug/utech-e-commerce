window.addEventListener('DOMContentLoaded', () => {
    // Construct Modal HTML
    const subscriptionPopupHTML = `
    <div id="subscriptionPopup" class="popup-overlay">
        <div class="popup-card">
            <button class="popup-close-btn" onclick="closePopup()">&times;</button>
            
            <div class="popup-badge">LIMITED OFFER</div>
            <h2>JOIN THE PACK!</h2>
            <p>Subscribe to our newsletter for instant access to premium game drops, exclusive restock alerts, and member-only tech discounts.</p>
            
            <form id="popupForm" onsubmit="handleSubscription(event)">
                <input type="email" id="subscriberEmail" placeholder="Enter your email address" required autocomplete="off">
                <button type="submit" class="popup-submit-btn">SUBSCRIBE NOW</button>
            </form>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', subscriptionPopupHTML);

    // Subtle 1.5-second timeout delay so the user sees the page layout first before the popup appears
    setTimeout(() => {
        if (!sessionStorage.getItem('smil3y_sub_shown')) {
            document.getElementById('subscriptionPopup').classList.add('show-popup');
            document.body.style.overflow = 'hidden';
        }
    }, 1500); 
});

// Close Popup Mechanics
window.closePopup = function() {
    document.getElementById('subscriptionPopup').classList.remove('show-popup');
    if (!document.querySelector('.modal-overlay.active')) {
        document.body.style.overflow = 'auto';
    }
    sessionStorage.setItem('smil3y_sub_shown', 'true');
};

// Handle Form Processing
window.handleSubscription = function(event) {
    event.preventDefault(); // Prevents page reload trigger
    const emailValue = document.getElementById('subscriberEmail').value;
    alert(`Awesome! Secure connection established for: ${emailValue}`);
    window.closePopup();
};