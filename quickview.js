document.addEventListener('DOMContentLoaded', () => {
    // Inject Modal HTML into the body dynamically
    const modalHTML = `
    <div id="quickViewModal" class="modal-overlay">
        <div class="modal-container">
            <button class="modal-close" aria-label="Close modal">&times;</button>
            <div class="img-skeleton-container">
                <img id="modalImg" class="lazy-load-img" src="" alt="Product Preview" loading="lazy" width="300" height="200">
                <div class="gallery-controls">
                    <button id="prevImg" class="gallery-btn-nav" aria-label="Previous image">&lsaquo;</button>
                    <button id="nextImg" class="gallery-btn-nav" aria-label="Next image">&rsaquo;</button>
                </div>
                <div id="modalThumbnails" class="modal-thumbnails">
                    <!-- Thumbnails will be injected here by JS -->
                </div>
            </div>
            <div class="product-info-modal">
                <h3 id="modalTitle"></h3>
                <div class="modal-main-specs">
                    <p id="modalSpecs"></p>
                </div>
                <div id="modalSpecsSection" class="modal-specs-section">
                    <h4>Recommended Specs</h4>
                    <div id="modalRecommendedSpecs"></div>
                </div>
                <div class="modal-footer-meta">
                    <span id="modalPrice" class="price" style="font-size: 2rem;"></span>
                    <a href="payment.html" id="modalBuyBtn" class="buy-btn" style="padding: 15px 30px;">Buy Now</a>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('quickViewModal');

    // Inject Coming Soon Popup HTML
    const comingSoonPopupHTML = `
    <div id="comingSoonPopup" class="popup-overlay">
        <div class="popup-card">
            <button class="popup-close-btn" id="closeComingSoonPopupBtn">&times;</button>
            <h2 id="comingSoonTitle">Coming Soon!</h2>
            <p id="comingSoonMsg">This feature is currently under development. Stay tuned for exciting updates!</p>
            <button class="popup-submit-btn" onclick="closeComingSoonPopup()">Got It!</button>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', comingSoonPopupHTML);

    const comingSoonPopup = document.getElementById('comingSoonPopup');
    const closeComingSoonPopupBtn = document.getElementById('closeComingSoonPopupBtn');

    // Helper function to manage body scroll based on active modals/popups
    const manageBodyScroll = () => {
        const modal = document.getElementById('quickViewModal');
        const comingSoonPopup = document.getElementById('comingSoonPopup');

        const quickViewActive = modal.classList.contains('active');
        const comingSoonActive = comingSoonPopup && comingSoonPopup.classList.contains('show-popup');

        if (quickViewActive || comingSoonActive) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    };

    const showComingSoonPopup = (title, message) => {
        document.getElementById('comingSoonTitle').innerText = title || "Coming Soon!";
        document.getElementById('comingSoonMsg').innerText = message || "This feature is currently under development. Stay tuned for exciting updates!";
        comingSoonPopup.classList.add('show-popup');
        manageBodyScroll();
    };

    const modalImg = document.getElementById('modalImg');
    const modalTitle = document.getElementById('modalTitle');
    const modalSpecs = document.getElementById('modalSpecs');
    const modalPrice = document.getElementById('modalPrice');
    const modalBuyBtn = document.getElementById('modalBuyBtn');
    const closeBtn = document.querySelector('.modal-close');
    const prevBtn = document.getElementById('prevImg');
    const nextBtn = document.getElementById('nextImg');
    const modalSpecsSection = document.getElementById('modalSpecsSection');
    const modalRecommendedSpecs = document.getElementById('modalRecommendedSpecs');
    const modalThumbnailsContainer = document.getElementById('modalThumbnails');

    let currentGallery = [];
    let currentIndex = 0;

    const updateModalImage = () => {
        // Remove fade-in class to re-trigger animation
        modalImg.classList.remove('fade-in');
        void modalImg.offsetWidth; // Trigger reflow to restart animation

        // Update main image source
        modalImg.src = currentGallery[currentIndex];
        modalImg.classList.add('fade-in');

        // Update active state for thumbnails
        const thumbnails = modalThumbnailsContainer.querySelectorAll('.modal-thumbnail-item');
        thumbnails.forEach((thumb, index) => {
            if (index === currentIndex) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });

        document.querySelector('.gallery-controls').style.display = currentGallery.length > 1 ? 'flex' : 'none';
    };

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('quickview-btn')) {
            const card = e.target.closest('.product-card');
            const title = card.querySelector('h3').innerText;
            const specs = card.querySelector('p').innerHTML;
            const price = card.querySelector('.price').innerText;
            const buyLink = card.querySelector('.buy-btn').getAttribute('href');
            const recommendedSpecs = card.getAttribute('data-recommended-specs');
            const galleryData = card.getAttribute('data-gallery');
            const mainImg = card.querySelector('img').getAttribute('src');

            // Retrieve dynamic coming soon content
            const comingSoonTitle = card.getAttribute('data-coming-soon-title');
            const comingSoonMsg = card.getAttribute('data-coming-soon-msg');
            
            currentGallery = galleryData ? galleryData.split(',') : [mainImg];
            // Trim whitespace from image paths
            currentGallery = currentGallery.map(path => path.trim());
            currentIndex = 0;

            modalTitle.innerText = title;
            modalSpecs.innerHTML = specs;
            modalPrice.innerText = price;

            // Handle Recommended Specs Visibility
            if (recommendedSpecs) {
                modalSpecsSection.style.display = 'block';
                modalRecommendedSpecs.innerHTML = `<p style="color: #a0aec0; font-size: 0.9rem; line-height: 1.6;">${recommendedSpecs}</p>`;
            } else {
                modalSpecsSection.style.display = 'none';
            }

            modalBuyBtn.setAttribute('href', buyLink);
            
            // Transfer coming soon data to modal buy button for persistence
            modalBuyBtn.setAttribute('data-coming-soon-title', comingSoonTitle || '');
            modalBuyBtn.setAttribute('data-coming-soon-msg', comingSoonMsg || '');

            // Render thumbnails
            modalThumbnailsContainer.innerHTML = ''; // Clear previous thumbnails
            currentGallery.forEach((imgSrc, index) => {
                const thumb = document.createElement('img');
                thumb.src = imgSrc;
                thumb.classList.add('modal-thumbnail-item');
                thumb.alt = `Thumbnail ${index + 1}`;
                thumb.addEventListener('click', () => {
                    currentIndex = index;
                    updateModalImage();
                });
                modalThumbnailsContainer.appendChild(thumb);
            });
            updateModalImage();

            modal.classList.add('active');
            manageBodyScroll();
        } else if (e.target.classList.contains('buy-btn')) {
            e.preventDefault(); // Prevent default navigation
            const target = e.target;
            const card = target.closest('.product-card');
            // Check button attributes first (for modal usage), then fallback to parent card
            const title = target.getAttribute('data-coming-soon-title') || (card && card.getAttribute('data-coming-soon-title'));
            const msg = target.getAttribute('data-coming-soon-msg') || (card && card.getAttribute('data-coming-soon-msg'));
            showComingSoonPopup(title, msg);
        }
    });

    nextBtn.onclick = () => { currentIndex = (currentIndex + 1) % currentGallery.length; updateModalImage(); };
    prevBtn.onclick = () => { currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length; updateModalImage(); };
    
    const closeModal = () => {
        modal.classList.remove('active');
        manageBodyScroll();
    };
    closeBtn.onclick = closeModal;

    window.closeComingSoonPopup = function() { // Made global for onclick attribute in HTML
        comingSoonPopup.classList.remove('show-popup');
        manageBodyScroll();
    };
    closeComingSoonPopupBtn.onclick = window.closeComingSoonPopup;

    window.onclick = (e) => {
        if (e.target === modal) closeModal();
        if (e.target === comingSoonPopup) window.closeComingSoonPopup();
    };
});