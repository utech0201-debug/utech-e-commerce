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
    const staticImgs = document.getElementsByClassName('lazy-load-img');
    for (let i = 0; i < staticImgs.length; i++) {
        revealImage(staticImgs[i]);
    }
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
const observer = new MutationObserver((mutations) => {
    for (let i = 0; i < mutations.length; i++) {
        const addedNodes = mutations[i].addedNodes;
        for (let j = 0; j < addedNodes.length; j++) {
            const node = addedNodes[j];
            if (node.nodeType !== 1) continue;

            // Check the node itself
            if (node.classList.contains('lazy-load-img') && node.complete) {
                node.classList.add('loaded');
            }
            
            // Search descendants using the faster getElementsByClassName
            const nested = node.getElementsByClassName('lazy-load-img');
            for (let k = 0; k < nested.length; k++) {
                if (nested[k].complete) nested[k].classList.add('loaded');
            }
            // Non-complete images are automatically handled by the global capture listener
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });