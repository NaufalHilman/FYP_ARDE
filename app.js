// ==========================================================================
// Central Component Matrix Loader
// ==========================================================================
function loadComponent(elementId, filepath, activeNavId) {
    fetch(filepath)
        .then(response => {
            if (!response.ok) throw new Error("Could not load element layout framework.");
            return response.text();
        })
        .then(data => {
            document.getElementById(elementId).innerHTML = data;
            
            // Apply page active highlighters if an ID rule is explicitly provided
            if (activeNavId) {
                const activeTab = document.getElementById(activeNavId);
                if (activeTab) activeTab.classList.add("active");
            }
        })
        .catch(error => console.error("Error loading component file:", error));
}

// ==========================================================================
// GLOBAL EVENT DELEGATION ENGINE (Strictly Click-Only Dropdowns)
// ==========================================================================
window.addEventListener("click", (event) => {
    const companyLink = event.target.closest("#nav-about");
    const companyWrapper = document.querySelector(".dropdown-wrapper");

    // Toggles menu states instantly if user selects the Company nav item header
    if (companyLink && companyWrapper) {
        event.preventDefault();
        event.stopPropagation();
        companyWrapper.classList.toggle("is-open");
        return; 
    }

    // Universal Escape Selector: Safely close menu layout frame if a click occurs outside
    if (companyWrapper && companyWrapper.classList.contains("is-open")) {
        if (!companyWrapper.contains(event.target)) {
            companyWrapper.classList.remove("is-open");
        }
    }
});