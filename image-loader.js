/**
 * SMILEY Premium Image Loader
 * Handles skeleton-to-image transitions with support for dynamic content and CLS prevention.
 */
const revealImage = (img) => {
    // Ensure the image has a parent container for the skeleton effect
    if (!img.closest('.img-skeleton-container')) {
        console.warn('Image for lazy loading is not inside .img-skeleton-container:', img);
        return;
    }

    if (img.complete) {
        img.classList.add('loaded');
    } else {
        img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
    }
};

// Initial load for static images present in the DOM
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.lazy-load-img').forEach(revealImage);
});

// Listen for load events in capture phase to handle dynamic src changes
// This is particularly useful for images within modals or dynamically updated sections
document.addEventListener('load', (e) => {
    if (e.target.classList && e.target.classList.contains('lazy-load-img')) {
        e.target.classList.add('loaded');
    }
}, true);

// Watch for newly added nodes to the DOM (e.g., when a modal is injected or content is loaded via AJAX)
// This ensures that any dynamically added images also get the lazy-load treatment.
new MutationObserver((mutations) => {
    mutations.forEach(m => m.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
            if (node.classList.contains('lazy-load-img')) revealImage(node);
            node.querySelectorAll('.lazy-load-img').forEach(revealImage);
        }
    }));
}).observe(document.body, { childList: true, subtree: true });