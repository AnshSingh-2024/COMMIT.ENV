// HomeHarvest AI - JavaScript Functionality

document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://127.0.0.1:8000';

    // Run functions for the current page
    handleAuthStatus();
    if (window.location.pathname.endsWith('login.html')) {
        initializeLoginPage();
    }
    if (window.location.pathname.endsWith('kitchen.html')) {
        initializeKitchenPage();
    }
    initializeGlobalElements();


    // --- Global Initializations ---
    function initializeGlobalElements() {
        // Mobile menu functionality
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');

        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // General file upload handlers
        setupFileUpload('pantry-upload', 'pantry-preview', 'pantry-image');
        setupFileUpload('plant-upload', 'plant-preview', 'plant-image');
    }

    // --- Authentication & Session Management ---
    function handleAuthStatus() {
        const user = getSession();
        const nav = document.querySelector('nav');

        if (user && user.user_id) { // User is logged in
            if (window.location.pathname.endsWith('login.html')) {
                window.location.href = 'index.html';
                return;
            }
            if (nav) {
                // Remove login button and add user menu
                const loginDesktop = document.getElementById('login-nav-link');
                if(loginDesktop) loginDesktop.remove();

                const loginMobile = document.getElementById('mobile-login-nav-link');
                if(loginMobile) loginMobile.remove();


                let userMenu = nav.querySelector('#user-menu');
                if (!userMenu) {
                    const navItems = nav.querySelector('.hidden.md\\:block .flex');
                    if (navItems) {
                        const userMenuHTML = `
                            <div id="user-menu" class="relative">
                                <button id="user-menu-button" class="ml-4 flex items-center space-x-2">
                                    <span class="text-gray-700 font-medium">${user.name}</span>
                                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </button>
                                <div id="user-dropdown" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden">
                                    <a href="#" id="logout-button" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</a>
                                </div>
                            </div>`;
                        navItems.insertAdjacentHTML('beforeend', userMenuHTML);

                        document.getElementById('user-menu-button').addEventListener('click', () => {
                            document.getElementById('user-dropdown').classList.toggle('hidden');
                        });
                        document.getElementById('logout-button').addEventListener('click', (e) => {
                           e.preventDefault();
                           logout();
                        });
                    }
                }
            }
        } else { // User is not logged in
            const protectedPages = ['/kitchen.html', '/garden.html', '/community.html'];
            if (protectedPages.some(page => window.location.pathname.endsWith(page))) {
                window.location.href = 'login.html';
            }
        }
    }

    function setSession(userData) {
        localStorage.setItem('homeHarvestUser', JSON.stringify(userData));
    }

    function getSession() {
        const userData = localStorage.getItem('homeHarvestUser');
        return userData ? JSON.parse(userData) : null;
    }

    function logout() {
        localStorage.removeItem('homeHarvestUser');
        sessionStorage.removeItem('lastGeneratedRecipes'); // Clear recipes on logout
        localStorage.removeItem('kitchenPreferences'); // Clear preferences on logout
        window.location.href = 'login.html';
    }

    // --- Page-Specific Initializers ---
    function initializeLoginPage() {
        const loginTab = document.getElementById('login-tab');
        const signupTab = document.getElementById('signup-tab');
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const formMessage = document.getElementById('form-message');

        loginTab.addEventListener('click', () => {
            loginTab.classList.add('text-green-600', 'border-green-600');
            loginTab.classList.remove('text-gray-500');
            signupTab.classList.remove('text-green-600', 'border-green-600');
            signupTab.classList.add('text-gray-500');
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
            formMessage.textContent = '';
        });

        signupTab.addEventListener('click', () => {
            signupTab.classList.add('text-green-600', 'border-green-600');
            signupTab.classList.remove('text-gray-500');
            loginTab.classList.remove('text-green-600', 'border-green-600');
            loginTab.classList.add('text-gray-500');
            signupForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
            formMessage.textContent = '';
        });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            formMessage.textContent = 'Logging in...';

            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });
                const data = await response.json();
                if (response.ok) {
                    setSession({ user_id: data.user_id, name: data.name });
                    window.location.href = 'index.html';
                } else {
                    formMessage.textContent = data.detail || 'Login failed.';
                    formMessage.classList.add('text-red-500');
                }
            } catch (error) {
                formMessage.textContent = 'An error occurred. Please try again.';
                formMessage.classList.add('text-red-500');
            }
        });

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const dietary_preference = document.getElementById('diet').value;
            formMessage.textContent = 'Creating account...';

            try {
                const response = await fetch(`${API_BASE_URL}/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, dietary_preference }),
                });
                 const data = await response.json();
                if (response.ok) {
                    formMessage.textContent = 'Account created! Please log in.';
                    formMessage.classList.remove('text-red-500');
                    formMessage.classList.add('text-green-500');
                    loginTab.click();
                } else {
                    formMessage.textContent = data.detail || 'Signup failed.';
                     formMessage.classList.add('text-red-500');
                }
            } catch (error) {
                formMessage.textContent = 'An error occurred. Please try again.';
                 formMessage.classList.add('text-red-500');
            }
        });
    }

    async function initializeKitchenPage() {
        const user = getSession();
        if (!user) return;

        // --- Preferences UI Elements ---
        const difficultyGroup = document.getElementById('difficulty-group');
        const timeSelect = document.getElementById('time-available');
        const servingsInput = document.getElementById('servings');
        const servingsDec = document.getElementById('servings-decrement');
        const servingsInc = document.getElementById('servings-increment');
        const purchaseExtras = document.getElementById('purchase-extras');
        const cuisineInput = document.getElementById('cuisine');
        const dietDisplay = document.getElementById('diet-display');
        const generateBtn = document.getElementById('generate-recipes');

        // --- Functions to save and load preferences ---
        function savePreferences() {
            const prefs = {
                difficulty: document.querySelector('#difficulty-group .bg-green-600')?.dataset.value || 'Easy',
                time: timeSelect.value,
                servings: servingsInput.value,
                purchase: purchaseExtras.checked,
                cuisine: cuisineInput.value
            };
            localStorage.setItem('kitchenPreferences', JSON.stringify(prefs));
        }

        function loadPreferences() {
            const prefs = JSON.parse(localStorage.getItem('kitchenPreferences'));
            if (!prefs) return;

            // Set difficulty
            difficultyGroup.querySelectorAll('button').forEach(b => {
                b.classList.remove('bg-green-600', 'text-white');
                if (b.dataset.value === prefs.difficulty) {
                     b.classList.add('bg-green-600', 'text-white');
                }
            });

            // Set other values
            timeSelect.value = prefs.time;
            servingsInput.value = prefs.servings;
            cuisineInput.value = prefs.cuisine;
            purchaseExtras.checked = prefs.purchase;

            // Update toggle switch UI
            updatePurchaseToggleUI();
        }

        function updatePurchaseToggleUI() {
            const toggleTrack = purchaseExtras.parentElement.querySelector('span');
            const toggleKnob = toggleTrack.querySelector('span');
            if (purchaseExtras.checked) {
                toggleTrack.classList.remove('bg-gray-200');
                toggleTrack.classList.add('bg-green-500');
                toggleKnob.style.transform = 'translateX(16px)';
            } else {
                toggleTrack.classList.add('bg-gray-200');
                toggleTrack.classList.remove('bg-green-500');
                toggleKnob.style.transform = 'translateX(0px)';
            }
        }


        // --- Event Listeners for Preferences ---
        difficultyGroup.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-value]');
            if (!btn) return;
            difficultyGroup.querySelectorAll('button').forEach(b => {
                b.classList.remove('bg-green-600', 'text-white');
            });
            btn.classList.add('bg-green-600', 'text-white');
            savePreferences();
        });

        servingsDec.addEventListener('click', () => {
            const currentVal = parseInt(servingsInput.value);
            if (currentVal > 1) servingsInput.value = currentVal - 1;
            savePreferences();
        });

        servingsInc.addEventListener('click', () => {
             servingsInput.value = parseInt(servingsInput.value) + 1;
             savePreferences();
        });

        purchaseExtras.addEventListener('change', () => {
             updatePurchaseToggleUI();
             savePreferences();
        });

        // Add event listeners to other inputs to save on change
        [timeSelect, servingsInput, cuisineInput].forEach(el => {
            el.addEventListener('change', savePreferences);
        });


        // --- Generate Recipes Button ---
        generateBtn.addEventListener('click', async () => {
            savePreferences(); // Save latest prefs before generating
            const payload = {
                Difficulty: document.querySelector('#difficulty-group .bg-green-600')?.dataset.value || 'Medium',
                TimeAvailable: parseInt(timeSelect.value, 10),
                Shopping: purchaseExtras.checked,
                Cuisine: cuisineInput.value || 'Any',
                Serving: parseInt(servingsInput.value, 10),
                Diet: dietDisplay.textContent || 'Veg'
            };

            showNotification('Generating recipes from your pantry...', 'info');

             try {
                const response = await fetch(`${API_BASE_URL}/recipes/${user.user_id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const data = await response.json();
                if(response.ok) {
                     displayRecipes(data.Recipes);
                     // Save recipes to session storage
                     sessionStorage.setItem('lastGeneratedRecipes', JSON.stringify(data.Recipes));
                } else {
                    showNotification(data.detail || 'Could not generate recipes. Is your pantry empty?', 'error');
                }
             } catch(error) {
                 showNotification('An error occurred while generating recipes.', 'error');
             }
        });

        // --- Initial Page Load Logic ---

        // 1. Load saved preferences from localStorage
        loadPreferences();

        // 2. Load and display saved recipes from sessionStorage
        const savedRecipes = sessionStorage.getItem('lastGeneratedRecipes');
        if (savedRecipes) {
            displayRecipes(JSON.parse(savedRecipes));
        }

        // 3. Fetch user's diet preference from the server
        try {
            const response = await fetch(`${API_BASE_URL}/user/${user.user_id}`);
            if(response.ok) {
                const userData = await response.json();
                dietDisplay.textContent = userData.dietary_preference || 'Not Set';
                 dietDisplay.classList.remove('bg-gray-100', 'text-gray-700');
                 dietDisplay.classList.add('bg-green-100', 'text-green-700');
            } else {
                 dietDisplay.textContent = 'Error';
            }
        } catch (error) {
            dietDisplay.textContent = 'Error loading diet';
        }
    }


    // --- Helper Functions ---
    function setupFileUpload(inputId, previewId, imageId) {
        const uploadInput = document.getElementById(inputId);
        if (!uploadInput) return;

        const preview = document.getElementById(previewId);
        const image = document.getElementById(imageId);
        const uploadArea = uploadInput.closest('.upload-area');

        uploadArea.addEventListener('click', () => uploadInput.click());
        uploadInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                image.src = URL.createObjectURL(file);
                preview.classList.remove('hidden');
                uploadArea.classList.add('upload-loading');
                showNotification('Uploading and analyzing image...', 'info');

                const user = getSession();
                if (!user || !user.user_id) {
                    showNotification('You must be logged in to upload.', 'error');
                    uploadArea.classList.remove('upload-loading');
                    return;
                }

                const formData = new FormData();
                formData.append('file', file);

                try {
                    const response = await fetch(`${API_BASE_URL}/inventory/${user.user_id}`, {
                        method: 'POST',
                        body: formData,
                    });
                     const data = await response.json();
                     if(response.ok) {
                          showNotification(data.message || 'Inventory updated!', 'success');
                     } else {
                          showNotification(data.detail || 'Upload failed.', 'error');
                     }
                } catch (error) {
                     showNotification('An error occurred during upload.', 'error');
                } finally {
                    uploadArea.classList.remove('upload-loading');
                }
            }
        });
    }

    function displayRecipes(recipes) {
        const container = document.getElementById('featured-recipes-container');
        if (!container) return;

        container.innerHTML = '';
        if (!recipes || recipes.length === 0) {
            container.innerHTML = `<div class="text-center py-10 px-6 bg-gray-50 rounded-lg"><p class="text-gray-600">No recipes found based on your inventory and preferences.</p></div>`;
            return;
        }

        recipes.forEach(recipe => {
            const recipeCard = `
                <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-100 animate-fade-in">
                    <h3 class="text-xl font-semibold text-gray-900">${recipe.name}</h3>
                    <p class="text-sm text-gray-600">Prep: ${recipe.prep_time_minutes} min | Cook: ${recipe.cook_time_minutes} min</p>
                    <p class="text-gray-600 my-2">${recipe.description}</p>
                    <div>
                        <h4 class="font-medium text-gray-900 mt-4">Ingredients:</h4>
                        <ul class="text-sm text-gray-600 list-disc list-inside space-y-1">
                            ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                        </ul>
                        <h4 class="font-medium text-gray-900 mt-4">Instructions:</h4>
                         <ol class="text-sm text-gray-600 list-decimal list-inside space-y-1">
                            ${recipe.instructions.map(step => `<li>${step}</li>`).join('')}
                        </ol>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', recipeCard);
        });
        showNotification('Recipes generated successfully!', 'success');
    }

    function showNotification(message, type = 'info') {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        let bgColor;
        switch (type) {
            case 'success': bgColor = 'bg-green-600'; break;
            case 'error': bgColor = 'bg-red-600'; break;
            default: bgColor = 'bg-blue-600';
        }
        notification.className = `notification ${bgColor} text-white fixed top-20 right-4 p-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.remove('translate-x-full'), 100);
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    console.log('HomeHarvest AI - Website loaded successfully! 🌱');
});

