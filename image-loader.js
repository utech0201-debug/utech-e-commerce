/**
 * SMILEY Premium Image Loader
 * Handles skeleton-to-image transitions with support for dynamic content.
 */
const revealImage = (img) => {
    if (img.complete) {
        img.classList.add('loaded');
    } else {
        img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
    }
};

// Initial load for static images
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.lazy-load-img').forEach(revealImage);
});

// Listen for load events in capture phase to handle dynamic src changes (like in the Quick View modal)
document.addEventListener('load', (e) => {
    if (e.target.classList && e.target.classList.contains('lazy-load-img')) {
        e.target.classList.add('loaded');
    }
}, true);

// Watch for newly added nodes (like when the modal is injected)
new MutationObserver((mutations) => {
    mutations.forEach(m => m.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
            if (node.classList.contains('lazy-load-img')) revealImage(node);
            node.querySelectorAll('.lazy-load-img').forEach(revealImage);
        }
    }));
}).observe(document.body, { childList: true, subtree: true });