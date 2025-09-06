// HomeHarvest AI - JavaScript Functionality

document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://127.0.0.1:8000';

    // --- Page Router ---
    handleAuthStatus();
    const path = window.location.pathname;
    if (path.endsWith('login.html')) initializeLoginPage();
    else if (path.endsWith('kitchen.html')) initializeKitchenPage();
    else if (path.endsWith('account.html')) initializeAccountPage();
    initializeGlobalElements();


    // --- Global Initializations ---
    function initializeGlobalElements() {
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
        }
    }

    // --- Authentication & Session Management ---
    function handleAuthStatus() {
        const user = getSession();
        if (user && user.user_id) {
            if (window.location.pathname.endsWith('login.html')) {
                window.location.href = 'index.html';
                return;
            }
            setupUserMenu(user.name);
        } else {
            const protectedPages = ['/kitchen.html', '/garden.html', '/community.html', '/account.html'];
            if (protectedPages.some(page => window.location.pathname.includes(page))) {
                window.location.href = 'login.html';
            }
        }
    }

    function setupUserMenu(username) {
        const navItems = document.querySelector('nav .hidden.md\\:block .flex');
        if (!navItems || document.getElementById('user-menu')) return;

        const userMenuHTML = `
            <div id="user-menu" class="relative">
                <button id="user-menu-button" class="ml-4 flex items-center space-x-2">
                    <span class="text-gray-700 font-medium">${username}</span>
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div id="user-dropdown" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden">
                    <a href="account.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Account</a>
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

    function setSession(userData) { localStorage.setItem('homeHarvestUser', JSON.stringify(userData)); }
    function getSession() { return JSON.parse(localStorage.getItem('homeHarvestUser')); }
    function logout() {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'login.html';
    }

    // --- Loading Animation ---
    function showLoader(text) {
        const loaderModal = document.getElementById('loader-modal');
        if (loaderModal) {
            document.getElementById('loader-text').textContent = text;
            loaderModal.classList.add('flex');
            loaderModal.classList.remove('hidden');
        }
    }
    function hideLoader() {
        const loaderModal = document.getElementById('loader-modal');
        if (loaderModal) {
            loaderModal.classList.add('hidden');
            loaderModal.classList.remove('flex');
        }
    }

    // --- Page Initializers ---
    function initializeLoginPage() {
        const loginTab = document.getElementById('login-tab');
        const signupTab = document.getElementById('signup-tab');
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const formMessage = document.getElementById('form-message');

        loginTab?.addEventListener('click', () => {
            loginTab.classList.add('text-green-600', 'border-green-600');
            loginTab.classList.remove('text-gray-500');
            signupTab.classList.remove('text-green-600', 'border-green-600');
            signupTab.classList.add('text-gray-500');
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
            formMessage.textContent = '';
        });

        signupTab?.addEventListener('click', () => {
            signupTab.classList.add('text-green-600', 'border-green-600');
            signupTab.classList.remove('text-gray-500');
            loginTab.classList.remove('text-green-600', 'border-green-600');
            loginTab.classList.add('text-gray-500');
            signupForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
            formMessage.textContent = '';
        });

        loginForm?.addEventListener('submit', async (e) => {
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
                if (!response.ok) throw new Error(data.detail);
                setSession({ user_id: data.user_id, name: data.name });
                window.location.href = 'kitchen.html';
            } catch (error) {
                 formMessage.textContent = error.message;
                 formMessage.classList.add('text-red-500');
            }
        });

        signupForm?.addEventListener('submit', async (e) => {
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
                if (!response.ok) throw new Error(data.detail);
                formMessage.textContent = 'Account created! Please log in.';
                formMessage.classList.remove('text-red-500');
                formMessage.classList.add('text-green-500');
                loginTab.click();
            } catch (error) {
                formMessage.textContent = error.message;
                formMessage.classList.add('text-red-500');
            }
        });
    }

    async function initializeAccountPage() {
        const user = getSession();
        if (!user) return;

        const passwordForm = document.getElementById('password-form');
        const dietForm = document.getElementById('diet-form');
        const dietSelect = document.getElementById('diet-preference');
        const passwordMessage = document.getElementById('password-message');
        const dietMessage = document.getElementById('diet-message');

        try {
            const response = await fetch(`${API_BASE_URL}/user/${user.user_id}`);
            const data = await response.json();
            if (response.ok) {
                dietSelect.value = data.dietary_preference;
            }
        } catch (error) {
            showNotification('Could not load your preferences.', 'error');
        }

        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            passwordMessage.textContent = 'Updating...';

            try {
                const response = await fetch(`${API_BASE_URL}/user/${user.user_id}/update`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.detail);
                showNotification(data.message, 'success');
                passwordForm.reset();
                passwordMessage.textContent = '';
            } catch (error) {
                showNotification(error.message, 'error');
                passwordMessage.textContent = '';
            }
        });

        dietForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newDiet = dietSelect.value;
            dietMessage.textContent = 'Saving...';

             try {
                const response = await fetch(`${API_BASE_URL}/user/${user.user_id}/update`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dietary_preference: newDiet }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.detail);
                showNotification(data.message, 'success');
                dietMessage.textContent = '';
            } catch (error) {
                showNotification(error.message, 'error');
                dietMessage.textContent = '';
            }
        });
    }

    async function initializeKitchenPage() {
        const user = getSession();
        if (!user) return;

        const difficultyGroup = document.getElementById('difficulty-group');
        const timeSelect = document.getElementById('time-available');
        const servingsInput = document.getElementById('servings');
        const servingsDec = document.getElementById('servings-decrement');
        const servingsInc = document.getElementById('servings-increment');
        const purchaseExtras = document.getElementById('purchase-extras');
        const cuisineInput = document.getElementById('cuisine');
        const dietSelector = document.getElementById('diet-preference-selector');
        const generateBtn = document.getElementById('generate-recipes');
        const inventoryContainer = document.getElementById('inventory-display');
        const recipesContainer = document.getElementById('featured-recipes-container');
        const pantryUploadInput = document.getElementById('pantry-upload');
        const pantryUploadArea = document.getElementById('pantry-upload-area');
        const pantryPreview = document.getElementById('pantry-preview');
        const pantryImage = document.getElementById('pantry-image');
        const pantryConfirmBtn = document.getElementById('pantry-confirm-btn');
        const pantryRemoveBtn = document.getElementById('pantry-remove-btn');
        let currentPantryFile = null;

        initializeRecipeModal();
        let currentRecipes = [];
        let currentInventory = [];

        pantryUploadArea.addEventListener('click', () => pantryUploadInput.click());
        pantryUploadInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (file) {
                currentPantryFile = file;
                pantryImage.src = URL.createObjectURL(file);
                pantryPreview.classList.remove('hidden');
                pantryUploadArea.classList.add('hidden');
            }
        });
        pantryRemoveBtn.addEventListener('click', () => {
            currentPantryFile = null;
            pantryUploadInput.value = '';
            pantryPreview.classList.add('hidden');
            pantryUploadArea.classList.remove('hidden');
        });
        pantryConfirmBtn.addEventListener('click', async () => {
            if (!currentPantryFile) return;
            const formData = new FormData();
            formData.append('file', currentPantryFile);
            showLoader('Analyzing your pantry...');
            try {
                const response = await fetch(`${API_BASE_URL}/inventory/${user.user_id}`, { method: 'POST', body: formData });
                const data = await response.json();
                if (!response.ok) throw new Error(data.detail);
                showNotification(data.message || 'Inventory updated!', 'success');
                await fetchAndDisplayInventory();
            } catch (error) { showNotification(error.message, 'error'); }
            finally {
                hideLoader();
                pantryRemoveBtn.click();
            }
        });

        inventoryContainer.addEventListener('click', async (e) => {
            const button = e.target.closest('button[data-item-name]');
            if (!button) return;
            const itemName = button.dataset.itemName;
            const change = parseInt(button.dataset.change, 10);
            try {
                const response = await fetch(`${API_BASE_URL}/inventory/${user.user_id}/update-item`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ item_name: itemName, change: change })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.detail);
                await fetchAndDisplayInventory();
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });

        function savePreferences() {
            const prefs = {
                difficulty: document.querySelector('#difficulty-group .bg-green-600')?.dataset.value || 'Easy',
                time: timeSelect.value, servings: servingsInput.value,
                purchase: purchaseExtras.checked, cuisine: cuisineInput.value
            };
            localStorage.setItem('kitchenPreferences', JSON.stringify(prefs));
        }
        function loadPreferences() {
            const prefs = JSON.parse(localStorage.getItem('kitchenPreferences'));
            if (!prefs) return;
            difficultyGroup.querySelectorAll('button').forEach(b => {
                b.classList.remove('bg-green-600', 'text-white');
                if (b.dataset.value === prefs.difficulty) b.classList.add('bg-green-600', 'text-white');
            });
            timeSelect.value = prefs.time;
            servingsInput.value = prefs.servings;
            cuisineInput.value = prefs.cuisine;
            purchaseExtras.checked = prefs.purchase;
            updatePurchaseToggleUI();
        }
        function updatePurchaseToggleUI() {
            const knob = purchaseExtras.parentElement.querySelector('span > span');
            knob.style.transform = purchaseExtras.checked ? 'translateX(16px)' : 'translateX(0px)';
        }
        difficultyGroup.addEventListener('click', e => {
            const btn = e.target.closest('button[data-value]');
            if (!btn) return;
            difficultyGroup.querySelectorAll('button').forEach(b => b.classList.remove('bg-green-600', 'text-white'));
            btn.classList.add('bg-green-600', 'text-white');
            savePreferences();
        });
        servingsDec.addEventListener('click', () => { if (servingsInput.value > 1) servingsInput.value--; savePreferences(); });
        servingsInc.addEventListener('click', () => { servingsInput.value++; savePreferences(); });
        purchaseExtras.addEventListener('change', () => { updatePurchaseToggleUI(); savePreferences(); });
        [timeSelect, servingsInput, cuisineInput, dietSelector].forEach(el => el.addEventListener('change', savePreferences));

        dietSelector.addEventListener('change', async () => {
            const newDiet = dietSelector.value;
            showNotification('Saving your preference...', 'info');
             try {
                const response = await fetch(`${API_BASE_URL}/user/${user.user_id}/update`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dietary_preference: newDiet }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.detail);
                showNotification('Diet preference saved!', 'success');
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });

        generateBtn.addEventListener('click', async () => {
            savePreferences();
            const payload = {
                Difficulty: document.querySelector('#difficulty-group .bg-green-600')?.dataset.value,
                TimeAvailable: parseInt(timeSelect.value), Shopping: purchaseExtras.checked,
                Cuisine: cuisineInput.value || 'Any', Serving: parseInt(servingsInput.value),
                Diet: dietSelector.value
            };
            showLoader('Generating your recipes...');
             try {
                const response = await fetch(`${API_BASE_URL}/recipes/${user.user_id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.detail);
                currentRecipes = data.Recipes;
                displayRecipes(currentRecipes);
                sessionStorage.setItem('lastGeneratedRecipes', JSON.stringify(currentRecipes));
             } catch(error) { showNotification(error.message, 'error'); }
             finally { hideLoader(); }
        });

        function displayRecipes(recipes) {
            if (!recipes || recipes.length === 0) {
                recipesContainer.innerHTML = `<div class="text-center py-10 px-6 bg-gray-50 rounded-lg"><p class="text-gray-600">No recipes found.</p></div>`;
                return;
            }
            recipesContainer.innerHTML = recipes.map((recipe, index) => `
                <div class="bg-white rounded-xl p-6 shadow-lg border animate-fade-in cursor-pointer hover:shadow-xl hover:border-green-500 transition-all" data-recipe-index="${index}">
                    <h3 class="text-xl font-semibold text-gray-900 pointer-events-none">${recipe.name}</h3>
                    <p class="text-sm text-gray-600 pointer-events-none">Prep: ${recipe.prep_time_minutes} min | Cook: ${recipe.cook_time_minutes} min</p>
                    <p class="text-gray-600 my-2 pointer-events-none">${recipe.description}</p>
                </div>`).join('');
        }

        async function fetchAndDisplayInventory() {
            try {
                const response = await fetch(`${API_BASE_URL}/inventory/${user.user_id}`);
                const data = await response.json();
                if (!response.ok) {
                    currentInventory = [];
                    inventoryContainer.innerHTML = `<p class="text-gray-500">Your inventory is empty.</p>`;
                    return;
                }
                currentInventory = data.items || [];
                if (currentInventory.length === 0) {
                    inventoryContainer.innerHTML = `<p class="text-gray-500">Your inventory is empty.</p>`;
                } else {
                    inventoryContainer.innerHTML = currentInventory.map(item => `
                        <div class="flex justify-between items-center bg-green-50 p-2 rounded-lg animate-fade-in">
                            <span class="text-green-800 font-medium flex-1 mr-2">${item.item_name}</span>
                            <div class="flex items-center">
                                <button data-item-name="${item.item_name}" data-change="-1" class="bg-green-200 hover:bg-green-300 text-green-800 font-bold w-6 h-6 rounded-full flex items-center justify-center">-</button>
                                <span class="w-10 text-center font-semibold">${item.quantity}</span>
                                <button data-item-name="${item.item_name}" data-change="1" class="bg-green-200 hover:bg-green-300 text-green-800 font-bold w-6 h-6 rounded-full flex items-center justify-center">+</button>
                            </div>
                        </div>`).join('');
                }
            } catch (error) {
                currentInventory = [];
                inventoryContainer.innerHTML = `<p class="text-red-500">Error loading inventory.</p>`;
            }
        }

        function initializeRecipeModal() {
            const modal = document.getElementById('recipe-modal');
            const closeBtn = document.getElementById('recipe-modal-close');
            const modalFooter = document.getElementById('recipe-modal-footer');
            let savedScrollPosition = 0;

            recipesContainer.addEventListener('click', (e) => {
                const card = e.target.closest('[data-recipe-index]');
                if (card) {
                    const recipeIndex = parseInt(card.dataset.recipeIndex, 10);
                    const recipe = currentRecipes[recipeIndex];
                    if (recipe) {
                        openRecipeModal(recipe);
                    }
                }
            });

            async function openRecipeModal(recipe) {
                document.getElementById('recipe-modal-title').textContent = recipe.name;
                document.getElementById('recipe-modal-description').textContent = recipe.description;
                document.getElementById('recipe-modal-prep-time').textContent = `Prep: ${recipe.prep_time_minutes} min`;
                document.getElementById('recipe-modal-cook-time').textContent = `Cook: ${recipe.cook_time_minutes} min`;
                document.getElementById('recipe-modal-instructions').innerHTML = recipe.instructions.map(step => `<li>${step}</li>`).join('');

                const inventoryItemNamesLower = currentInventory.map(item => item.item_name.toLowerCase());
                const missingIngredientStrings = [];

                document.getElementById('recipe-modal-ingredients').innerHTML = recipe.ingredients.map(descriptiveIngredient => {
                    const descriptiveIngredientLower = descriptiveIngredient.toLowerCase();
                    const foundInInventory = inventoryItemNamesLower.some(inventoryItem => descriptiveIngredientLower.includes(inventoryItem));

                    if (foundInInventory) {
                        return `<li class="text-green-700">${descriptiveIngredient} (In Stock)</li>`;
                    } else {
                        missingIngredientStrings.push(descriptiveIngredient);
                        return `<li class="text-red-700">${descriptiveIngredient} (Missing)</li>`;
                    }
                }).join('');

                modalFooter.innerHTML = '';
                // **THE FIX IS HERE**: Check the purchaseExtras toggle before showing the button
                if (purchaseExtras.checked && missingIngredientStrings.length > 0) {
                    const shopBtn = document.createElement('button');
                    shopBtn.id = 'shop-missing-btn';
                    shopBtn.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-10 rounded w-full';
                    shopBtn.textContent = 'Add Missing to Amazon Cart';
                    modalFooter.appendChild(shopBtn);

                    shopBtn.addEventListener('click', async () => {
                        shopBtn.textContent = 'Cleaning Ingredients...';
                        shopBtn.disabled = true;
                        try {
                            const cleanResponse = await fetch(`${API_BASE_URL}/clean-ingredients`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ingredients: missingIngredientStrings })
                            });
                            const cleanedItems = await cleanResponse.json();
                            if (!cleanResponse.ok) throw new Error('Failed to clean ingredients.');

                            shopBtn.textContent = 'Generating Link...';

                            const shoppingResponse = await fetch(`${API_BASE_URL}/shopping`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ "additionalProp1": cleanedItems })
                            });
                            const shoppingData = await shoppingResponse.json();
                            if (!shoppingResponse.ok) throw new Error(shoppingData.detail || 'Failed to get shopping link');

                            window.open(shoppingData.cart_url, '_blank');

                        } catch(error) {
                            showNotification(error.message, 'error');
                        } finally {
                            shopBtn.textContent = 'Add Missing to Amazon Cart';
                            shopBtn.disabled = false;
                        }
                    });
                }

                savedScrollPosition = window.scrollY;
                document.body.classList.add('modal-open');
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }

            const closeModal = () => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                document.body.classList.remove('modal-open');
                window.scrollTo(0, savedScrollPosition);
            };

            closeBtn.addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
        }

        // --- Initial Page Load ---
        loadPreferences();
        const savedRecipes = JSON.parse(sessionStorage.getItem('lastGeneratedRecipes'));
        if (savedRecipes) {
            currentRecipes = savedRecipes;
            displayRecipes(currentRecipes);
        }
        await fetchAndDisplayInventory();
        try {
            const response = await fetch(`${API_BASE_URL}/user/${user.user_id}`);
            const userData = await response.json();
            if (response.ok) dietSelector.value = userData.dietary_preference;
        } catch (error) { console.error("Could not load user diet preference."); }
    }

    // --- Helper Functions ---
    function showNotification(message, type = 'info') {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        const notification = document.createElement('div');
        const colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' };
        notification.className = `${colors[type]} text-white fixed top-20 right-4 p-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.remove('translate-x-full'), 100);
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
});