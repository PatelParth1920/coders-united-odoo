document.addEventListener("DOMContentLoaded", () => {
    const heroLogo = document.getElementById("heroLogo");
    const blackCurve = document.getElementById("blackCurve");

    // 1. Image slowly appears
    // We add a tiny delay (500ms) after the page loads before starting the fade-in
    setTimeout(() => {
        heroLogo.classList.add("appear");
    }, 500);

    // 2. Black curve rises from the bottom
    // We wait for the logo to finish fading in (3s) + stay on screen for a moment (1.5s)
    setTimeout(() => {
        blackCurve.classList.add("rise");
    }, 4000);

    // 3. Animation finished
    // Transition to the Main Hero Page
    setTimeout(() => {
        // Hide the initial animation elements to clean up the DOM view
        document.querySelector('.hero-container').style.display = 'none';
        document.getElementById('blackCurve').style.display = 'none';
        
        // Prepare the new main page content
        const mainPage = document.getElementById('mainHeroPage');
        mainPage.style.display = 'flex';
        
        // Slight delay to allow display:flex to apply before animating opacity
        setTimeout(() => {
            mainPage.style.opacity = '1';
        }, 50);
    }, 5500); // 4000ms delay + 1.5s curve animation time
});
