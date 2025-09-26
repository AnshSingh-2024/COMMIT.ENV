// HomeHarvest AI - JavaScript Functionality

document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://127.0.0.1:8000';

    // --- Page Router ---
    handleAuthStatus();
    const path = window.location.pathname;
    if (path.endsWith('login.html')) initializeLoginPage();
    else if (path.endsWith('kitchen.html')) initializeKitchenPage();
    else if (path.endsWith('garden.html')) initializeGardenPage();
    else if (path.endsWith('account.html')) initializeAccountPage();
    else if (path.endsWith('community.html')) initializeCommunityPage();
    initializeGlobalElements();


    // --- Global Initializations ---
    function initializeGlobalElements() {
        // Mobile menu
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
        }

        // Theme Toggle
        initializeThemeToggle();
    }

    // --- Dark/Light Mode Theme Toggle ---
    function initializeThemeToggle() {
        const themeToggleBtn = document.getElementById('theme-toggle');
        const darkIcon = document.getElementById('theme-toggle-dark-icon');
        const lightIcon = document.getElementById('theme-toggle-light-icon');

        // Apply saved theme on load
        if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            lightIcon.classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            darkIcon.classList.remove('hidden');
        }

        themeToggleBtn.addEventListener('click', function() {
            darkIcon.classList.toggle('hidden');
            lightIcon.classList.toggle('hidden');

            if (localStorage.getItem('color-theme')) { // If theme is set in localStorage
                if (localStorage.getItem('color-theme') === 'light') {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('color-theme', 'dark');
                } else {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('color-theme', 'light');
                }
            } else { // If theme is not set in localStorage
                if (document.documentElement.classList.contains('dark')) {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('color-theme', 'light');
                } else {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('color-theme', 'dark');
                }
            }
        });
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
                    <span class="text-gray-700 dark:text-gray-300 font-medium">${username}</span>
                    <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div id="user-dropdown" class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-50 hidden">
                    <a href="account.html" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">My Account</a>
                    <a href="#" id="logout-button" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">Logout</a>
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
async function initializeCommunityPage() {
    const user = getSession();
    if (!user) {
        const communityHub = document.querySelector('.py-16');
        if (communityHub) {
            communityHub.innerHTML = `<div class="text-center"><p class="text-lg">Please <a href="login.html" class="text-green-500 underline">log in</a> to access the community hub.</p></div>`;
        }
        return;
    }

    // --- DOM ELEMENT REFERENCES ---
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');
    const modals = {
        shareRecipe: document.getElementById('share-recipe-modal'),
        viewRecipe: document.getElementById('view-recipe-modal'),
        askQuestion: document.getElementById('ask-question-modal'),
        viewPost: document.getElementById('view-post-modal'),
    };
    const recipesContainer = document.getElementById('recipes-container');
    const shareRecipeForm = document.getElementById('share-recipe-form');
    const leaderboardContainer = document.getElementById('leaderboard-container');
    const forumContainer = document.getElementById('forum-container');

    // --- HELPER FUNCTIONS ---
    const openModal = (modal) => modal && modal.classList.replace('hidden', 'flex');
    const closeModal = (modal) => modal && modal.classList.replace('flex', 'hidden');

    const addItem = (listId, placeholder) => {
        const list = document.getElementById(listId);
        if (!list) return;
        const itemDiv = document.createElement('div');
        itemDiv.className = 'flex items-center gap-2';
        const inputClasses = "mt-1 block w-full border-gray-300 py-2 bg-offwhite-50 px-4 dark:bg-gray-700 dark:border-gray-600 rounded-md shadow-sm";
        itemDiv.innerHTML = (placeholder === 'Ingredient Name')
            ? `<input type="text" placeholder="${placeholder}" class="${inputClasses} flex-grow ingredient-name"><input type="text" placeholder="Quantity" class="${inputClasses} flex-grow ingredient-qty"><button type="button" class="remove-item-btn text-red-500 font-bold text-xl">&times;</button>`
            : `<input type="text" placeholder="Step description" class="${inputClasses} flex-grow instruction-step"><button type="button" class="remove-item-btn text-red-500 font-bold text-xl">&times;</button>`;
        list.appendChild(itemDiv);
    };

    const resetRecipeForm = () => {
        const ingredientsList = document.getElementById('ingredients-list');
        const instructionsList = document.getElementById('instructions-list');
        if (shareRecipeForm) shareRecipeForm.reset();
        if (ingredientsList) ingredientsList.innerHTML = '';
        if (instructionsList) instructionsList.innerHTML = '';
        addItem('ingredients-list', 'Ingredient Name');
        addItem('instructions-list', 'Instruction');
    };

    // --- DATA FETCHING AND RENDERING ---
    const renderRecipes = (recipes) => {
        if (!recipesContainer) return;
        if (recipes.length === 0) {
            recipesContainer.innerHTML = '<p class="col-span-full">No community recipes shared yet. Be the first!</p>';
            return;
        }
        recipesContainer.innerHTML = recipes.map(recipe => `
            <div class="feature-card flex flex-col">
                <h3 class="text-xl font-semibold">${recipe.recipe_name}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">by ${recipe.author_name}</p>
                <p class="text-sm text-gray-600 dark:text-gray-300 mt-2 flex-grow">${recipe.description.substring(0, 100)}...</p>
                <div class="flex justify-between items-center mt-4">
                    <button data-recipe-id="${recipe._id}" class="upvote-btn text-gray-500 hover:text-green-500 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" ${recipe.upvoted_by.includes(user.user_id) ? 'disabled' : ''}>
                        <svg class="w-5 h-5" fill="${recipe.upvoted_by.includes(user.user_id) ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
                        <span>${recipe.upvotes}</span>
                    </button>
                    <button data-recipe='${JSON.stringify(recipe)}' class="view-recipe-btn text-green-600 hover:underline">View Recipe</button>
                </div>
            </div>
        `).join('');
    };

    const fetchAndDisplayRecipes = async () => {
        if (!recipesContainer) return;
        recipesContainer.innerHTML = '<p class="col-span-full">Loading recipes...</p>';
        try {
            const response = await fetch(`${API_BASE_URL}/community/recipes`);
            const recipes = await response.json();
            renderRecipes(recipes);
        } catch (error) {
            recipesContainer.innerHTML = '<p class="col-span-full text-red-500">Could not load recipes.</p>';
        }
    };

    const fetchAndDisplayForum = async () => {
        if (!forumContainer) return;
        forumContainer.innerHTML = '<p class="text-center">Discussion forum is a work in progress and will be available soon!</p>';
    };

    const fetchAndDisplayLeaderboard = async () => {
        if (!leaderboardContainer) return;
        leaderboardContainer.innerHTML = '<p>Loading leaderboard...</p>';
        try {
            const response = await fetch(`${API_BASE_URL}/community/leaderboard`);
            const leaderboard = await response.json();
            leaderboardContainer.innerHTML = leaderboard.map((player, index) => `
                <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div class="flex items-center gap-4"><span class="font-bold text-lg text-green-500 w-6">${index + 1}</span><span class="font-medium">${player.name}</span></div>
                    <span class="font-bold text-gray-700 dark:text-gray-300">${player.points} points</span>
                </div>
            `).join('');
        } catch (error) {
            leaderboardContainer.innerHTML = '<p class="text-red-500">Could not load leaderboard.</p>';
        }
    };

    // --- EVENT LISTENERS ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('text-green-600', 'border-green-500'));
            panels.forEach(p => p.classList.add('hidden'));
            tab.classList.add('text-green-600', 'border-green-500');
            const panel = document.getElementById(`${tab.dataset.tab}-panel`);
            if (panel) panel.classList.remove('hidden');
            loadTabData(tab.dataset.tab);
        });
    });

    const loadTabData = (tab) => {
        if (tab === 'recipes') fetchAndDisplayRecipes();
        else if (tab === 'forum') fetchAndDisplayForum();
        else if (tab === 'leaderboard') fetchAndDisplayLeaderboard();
    };

    document.getElementById('share-recipe-btn')?.addEventListener('click', () => {
        resetRecipeForm();
        openModal(modals.shareRecipe);
    });
    document.getElementById('ask-question-btn')?.addEventListener('click', () => openModal(modals.askQuestion));

    Object.values(modals).forEach(modal => {
        if (!modal) return;
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('.modal-cancel-btn') || e.target.closest('.modal-close-btn')) {
                closeModal(modal);
            }
        });
    });

    document.getElementById('add-ingredient-btn')?.addEventListener('click', () => addItem('ingredients-list', 'Ingredient Name'));
    document.getElementById('add-instruction-btn')?.addEventListener('click', () => addItem('instructions-list', 'Instruction'));
    document.getElementById('ingredients-list')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item-btn')) e.target.parentElement.remove();
    });
    document.getElementById('instructions-list')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item-btn')) e.target.parentElement.remove();
    });

    shareRecipeForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoader('Posting your recipe...');
        const ingredients = Array.from(document.querySelectorAll('#ingredients-list > div')).map(div => ({
            name: div.querySelector('.ingredient-name').value,
            quantity: div.querySelector('.ingredient-qty').value,
        })).filter(i => i.name && i.quantity);
        const instructions = Array.from(document.querySelectorAll('#instructions-list > div')).map(div =>
            div.querySelector('.instruction-step').value
        ).filter(Boolean);
        const payload = { author_name: user.name, recipe_name: document.getElementById('recipe-name').value, description: document.getElementById('recipe-description').value, diet_type: document.getElementById('recipe-diet-type').value, ingredients, instructions };
        try {
            const response = await fetch(`${API_BASE_URL}/community/recipes/${user.user_id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail);
            showNotification(data.message, 'success');
            closeModal(modals.shareRecipe);
            fetchAndDisplayRecipes();
            fetchAndDisplayLeaderboard();
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            hideLoader();
        }
    });

    document.body.addEventListener('click', async (e) => {
        const upvoteBtn = e.target.closest('.upvote-btn');
        const viewRecipeBtn = e.target.closest('.view-recipe-btn');
        if (upvoteBtn) {
            const recipeId = upvoteBtn.dataset.recipeId;
            upvoteBtn.disabled = true;
            try {
                const response = await fetch(`${API_BASE_URL}/community/recipes/${recipeId}/upvote/${user.user_id}`, { method: 'POST' });
                const data = await response.json();
                if (!response.ok) throw new Error(data.detail);
                showNotification(data.message, 'success');
                fetchAndDisplayRecipes();
                fetchAndDisplayLeaderboard();
            } catch (error) {
                showNotification(error.message, 'error');
                upvoteBtn.disabled = false;
            }
        }
        if (viewRecipeBtn) {
            const recipe = JSON.parse(viewRecipeBtn.dataset.recipe);
            document.getElementById('view-recipe-title').textContent = recipe.recipe_name;
            document.getElementById('view-recipe-author').textContent = `By ${recipe.author_name}`;
            document.getElementById('view-recipe-description').textContent = recipe.description;
            document.getElementById('view-recipe-ingredients').innerHTML = recipe.ingredients.map(i => `<li>${i.quantity} ${i.name}</li>`).join('');
            document.getElementById('view-recipe-instructions').innerHTML = recipe.instructions.map(s => `<li>${s}</li>`).join('');
            openModal(modals.viewRecipe);
        }
    });

    // --- INITIAL PAGE LOAD ---
    loadTabData('recipes');
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
            const track = knob.parentElement;
            knob.style.transform = purchaseExtras.checked ? 'translateX(16px)' : 'translateX(0px)';
            if (purchaseExtras.checked) {
                track.classList.remove('bg-gray-200', 'dark:bg-gray-600');
                track.classList.add('bg-green-500');
            } else {
                track.classList.add('bg-gray-200', 'dark:bg-gray-600');
                track.classList.remove('bg-green-500');
            }
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
                recipesContainer.innerHTML = `<div class="text-center py-10 px-6 bg-gray-50 dark:bg-gray-800 rounded-lg"><p class="text-gray-600 dark:text-gray-400">No recipes found.</p></div>`;
                return;
            }
            recipesContainer.innerHTML = recipes.map((recipe, index) => `
                <div class="feature-card cursor-pointer hover:border-green-500 dark:hover:border-green-400" data-recipe-index="${index}">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white pointer-events-none">${recipe.name}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 pointer-events-none">Prep: ${recipe.prep_time_minutes} min | Cook: ${recipe.cook_time_minutes} min</p>
                    <p class="text-gray-600 dark:text-gray-300 my-2 pointer-events-none">${recipe.description}</p>
                </div>`).join('');
        }

        async function fetchAndDisplayInventory() {
            try {
                const response = await fetch(`${API_BASE_URL}/inventory/${user.user_id}`);
                const data = await response.json();
                if (!response.ok) {
                    currentInventory = [];
                    inventoryContainer.innerHTML = `<p class="text-gray-500 dark:text-gray-400">Your inventory is empty.</p>`;
                    return;
                }
                currentInventory = data.items || [];
                if (currentInventory.length === 0) {
                    inventoryContainer.innerHTML = `<p class="text-gray-500 dark:text-gray-400">Your inventory is empty.</p>`;
                } else {
                    inventoryContainer.innerHTML = currentInventory.map(item => `
                        <div class="flex justify-between items-center bg-green-50 dark:bg-green-900/50 p-2 rounded-lg animate-fade-in">
                            <span class="text-green-800 dark:text-green-200 font-medium flex-1 mr-2">${item.item_name}</span>
                            <div class="flex items-center">
                                <button data-item-name="${item.item_name}" data-change="-1" class="bg-green-200 dark:bg-green-800 hover:bg-green-300 dark:hover:bg-green-700 text-green-800 dark:text-green-100 font-bold w-6 h-6 rounded-full flex items-center justify-center">-</button>
                                <span class="w-10 text-center font-semibold">${item.quantity}</span>
                                <button data-item-name="${item.item_name}" data-change="1" class="bg-green-200 dark:bg-green-800 hover:bg-green-300 dark:hover:bg-green-700 text-green-800 dark:text-green-100 font-bold w-6 h-6 rounded-full flex items-center justify-center">+</button>
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
                        return `<li class="text-green-700 dark:text-green-400">${descriptiveIngredient} (In Stock)</li>`;
                    } else {
                        missingIngredientStrings.push(descriptiveIngredient);
                        return `<li class="text-red-700 dark:text-red-400">${descriptiveIngredient} (Missing)</li>`;
                    }
                }).join('');

                modalFooter.innerHTML = '';
                if (purchaseExtras.checked && missingIngredientStrings.length > 0) {
                     modalFooter.innerHTML = `
                        <div class="absolute bottom-4 right-4">
                            <button id="shop-missing-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center gap-2">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path></svg>
                                <span>Add to Cart</span>
                            </button>
                        </div>
                    `;

                    document.getElementById('shop-missing-btn').addEventListener('click', async (e) => {
                        const shopBtn = e.currentTarget;
                        shopBtn.innerHTML = '<span>Cleaning Ingredients...</span>';
                        shopBtn.disabled = true;
                        try {
                            const cleanResponse = await fetch(`${API_BASE_URL}/clean-ingredients`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ingredients: missingIngredientStrings })
                            });
                            const cleanedItems = await cleanResponse.json();
                            if (!cleanResponse.ok) throw new Error('Failed to clean ingredients.');

                            shopBtn.innerHTML = '<span>Generating Link...</span>';

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
                            shopBtn.innerHTML = `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path></svg><span>Add to Cart</span>`;
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
    async function initializeGardenPage() {
        const user = getSession();
        if (!user) return;

        let currentPlants = [];
        const gardenContainer = document.getElementById('garden-container');
        const gardenPlaceholder = document.getElementById('garden-placeholder');
        const careRemindersContainer = document.getElementById('care-reminders-container');
        const remindersPlaceholder = document.getElementById('reminders-placeholder');

        // --- MODAL & FORM ELEMENTS ---
        const addPlantModal = document.getElementById('add-plant-modal');
        const detailsModal = document.getElementById('plant-details-modal');
        const guideModal = document.getElementById('guide-modal');
        const addPlantForm = document.getElementById('add-plant-form');
        const diagnoseForm = document.getElementById('diagnose-plant-form');
        const guideModalTitle = document.getElementById('guide-modal-title');
        const guideModalSteps = document.getElementById('guide-modal-steps');

        // --- MODAL CONTROL FUNCTIONS ---
        const openModal = (modal) => {
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                document.body.classList.add('modal-open');
            }
        };

        const closeModal = (modal) => {
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                document.body.classList.remove('modal-open');
            }
        };

        // --- ROBUST EVENT LISTENER SETUP ---
        // This helper function prevents crashes if an element is not found.
        const addSafeListener = (selector, event, handler) => {
            const element = document.getElementById(selector);
            if (element) {
                element.addEventListener(event, handler);
            }
        };

        // Event Listeners for Opening/Closing Modals
        addSafeListener('add-plant-btn', 'click', () => openModal(addPlantModal));
        addSafeListener('add-plant-cancel', 'click', () => closeModal(addPlantModal));
        addSafeListener('details-modal-close', 'click', () => closeModal(detailsModal));
        addSafeListener('guide-modal-close', 'click', () => closeModal(guideModal));

        // Background clicks to close modals
        if (addPlantModal) addPlantModal.addEventListener('click', (e) => { if (e.target === addPlantModal) closeModal(addPlantModal); });
        if (detailsModal) detailsModal.addEventListener('click', (e) => { if (e.target === detailsModal) closeModal(detailsModal); });
        if (guideModal) guideModal.addEventListener('click', (e) => { if (e.target === guideModal) closeModal(guideModal); });


        // --- DATA FETCHING & DISPLAY ---
        const fetchAndDisplayGarden = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/garden/${user.user_id}`);
                if (!response.ok) throw new Error('Could not fetch garden data.');
                currentPlants = await response.json();

                if (gardenContainer && gardenPlaceholder) {
                    gardenContainer.innerHTML = ''; // Clear existing content
                    if (currentPlants.length === 0) {
                        gardenContainer.appendChild(gardenPlaceholder);
                        gardenPlaceholder.classList.remove('hidden');
                    } else {
                        gardenPlaceholder.classList.add('hidden');
                        currentPlants.forEach(plant => {
                            const latestHistory = plant.history[plant.history.length - 1];
                            const card = document.createElement('div');
                            card.className = 'feature-card cursor-pointer text-center';
                            card.dataset.plantId = plant._id;
                            card.innerHTML = `
                                <img src="${API_BASE_URL}/${latestHistory.image_path}" alt="${plant.plant_name}" class="w-full h-40 object-cover rounded-md mb-4">
                                <h3 class="text-lg font-semibold">${plant.plant_name}</h3>
                            `;
                            card.addEventListener('click', () => openDetailsModal(plant._id));
                            gardenContainer.appendChild(card);
                        });
                    }
                }
            } catch (error) {
                showNotification(error.message, 'error');
                if (gardenPlaceholder) {
                    gardenPlaceholder.textContent = 'Error loading your garden.';
                    gardenPlaceholder.classList.remove('hidden');
                }
            }
        };

        const openDetailsModal = (plantId) => {
            const plant = currentPlants.find(p => p._id === plantId);
            if (!plant) return;
            const detailsModalTitle = document.getElementById('details-modal-title');
            const historyContainer = document.getElementById('plant-history-container');

            if (detailsModalTitle) detailsModalTitle.textContent = plant.plant_name;
            if (diagnoseForm) diagnoseForm.dataset.plantId = plantId;
            if (historyContainer) {
                historyContainer.innerHTML = '';
                 [...plant.history].reverse().forEach(entry => {
                    const entryDate = new Date(entry.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
                    const historyElement = document.createElement('div');
                    historyElement.className = 'relative pl-8';
                    historyElement.innerHTML = `
                        <div class="absolute w-4 h-4 bg-green-500 rounded-full -left-[9px] top-1 border-4 border-white dark:border-gray-800"></div>
                        <p class="font-semibold text-gray-800 dark:text-gray-200">${entry.diagnosis}</p>
                        <time class="text-xs text-gray-500 dark:text-gray-400 mb-2 block">${entryDate}</time>
                        <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                            ${entry.recommendations.map(rec => {
                                if (typeof rec === 'object' && rec !== null && rec.title) {
                                    return `<li>${rec.title}</li>`;
                                }
                                return `<li>${rec}</li>`;
                            }).join('')}
                        </ul>
                    `;
                    historyContainer.appendChild(historyElement);
                });
            }
            openModal(detailsModal);
        };

        const displayLatestRecommendations = () => {
             const shopButtonContainer = document.getElementById('shop-button-container');
            if(shopButtonContainer) shopButtonContainer.innerHTML = '';

            const allRecommendations = currentPlants.flatMap(plant => {
                const latestHistory = plant.history[plant.history.length - 1];
                if (!latestHistory || !latestHistory.recommendations) return [];
                return latestHistory.recommendations.map(rec => ({ ...rec, plantName: plant.plant_name }));
            });

            const purchasableItems = [...new Set(allRecommendations.flatMap(rec => rec.purchasable_items || []))];

            if (careRemindersContainer && remindersPlaceholder) {
                 if(allRecommendations.length > 0) {
                    remindersPlaceholder.classList.add('hidden');
                    careRemindersContainer.innerHTML = allRecommendations.map(item => {
                        const stepsJson = JSON.stringify(item.steps);
                        return `
                            <div class="bg-green-50 dark:bg-green-900/50 p-3 rounded-lg cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/80 transition-colors recommendation-item"
                                data-title="${item.title}" data-steps='${stepsJson}'>
                                <p class="font-semibold text-green-800 dark:text-green-200">${item.plantName}</p>
                                <p class="text-sm text-gray-700 dark:text-gray-300 pointer-events-none">${item.title}</p>
                            </div>
                        `;
                    }).join('');
                } else {
                    remindersPlaceholder.classList.remove('hidden');
                    careRemindersContainer.innerHTML = '';
                }
            }

            if (shopButtonContainer && purchasableItems.length > 0) {
                const shopBtn = document.createElement('button');
                shopBtn.id = 'shop-garden-items-btn';
                shopBtn.className = 'w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2';
                shopBtn.innerHTML = `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path></svg> <span>Shop for Supplies</span>`;
                shopButtonContainer.appendChild(shopBtn);
                shopBtn.addEventListener('click', async () => {
                    showLoader('Finding items on Amazon...');
                    const shoppingPayload = { "additionalProp1": {} };
                    purchasableItems.forEach(item => { shoppingPayload.additionalProp1[item] = 1; });
                    try {
                        const response = await fetch(`${API_BASE_URL}/shopping`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(shoppingPayload) });
                        const data = await response.json();
                        if (!response.ok) throw new Error(data.detail || 'Failed to get shopping link.');
                        window.open(data.cart_url, '_blank');
                    } catch (error) { showNotification(error.message, 'error'); }
                    finally { hideLoader(); }
                });
            }
        };

        if (careRemindersContainer) {
            careRemindersContainer.addEventListener('click', (e) => {
                const item = e.target.closest('.recommendation-item');
                if (!item || !guideModal || !guideModalTitle || !guideModalSteps) return;
                const title = item.dataset.title;
                const steps = JSON.parse(item.dataset.steps);
                guideModalTitle.textContent = title;
                guideModalSteps.innerHTML = steps.map(step => `<li>${step}</li>`).join('');
                openModal(guideModal);
            });
        }

        // --- FORM SUBMISSION HANDLERS ---
        if (addPlantForm) {
            addPlantForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const plantNameInput = document.getElementById('plant-name');
                const plantImageInput = document.getElementById('plant-image-upload');
                if (!plantNameInput.value || !plantImageInput.files[0]) {
                    showNotification('Please provide a name and an image.', 'error');
                    return;
                }
                const formData = new FormData();
                formData.append('plant_name', plantNameInput.value);
                formData.append('file', plantImageInput.files[0]);
                showLoader('Adding plant to your garden...');
                try {
                    const response = await fetch(`${API_BASE_URL}/garden/${user.user_id}`, { method: 'POST', body: formData });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.detail);
                    showNotification(data.message, 'success');
                    addPlantForm.reset();
                    closeModal(addPlantModal);
                    await fetchAndDisplayGarden();
                } catch (error) {
                    showNotification(error.message, 'error');
                } finally {
                    hideLoader();
                }
            });
        }

        if (diagnoseForm) {
            diagnoseForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const plantId = e.currentTarget.dataset.plantId;
                const diagnoseImageInput = document.getElementById('diagnose-image-upload');
                if (!diagnoseImageInput.files[0]) {
                    showNotification('Please select an image to analyze.', 'error');
                    return;
                }
                const formData = new FormData();
                formData.append('file', diagnoseImageInput.files[0]);
                showLoader('Analyzing your plant...');
                try {
                    const response = await fetch(`${API_BASE_URL}/garden/diagnose/${plantId}`, { method: 'POST', body: formData });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.detail);
                    showNotification(data.message, 'success');
                    diagnoseForm.reset();
                    closeModal(detailsModal);
                    await fetchAndDisplayGarden();
                    displayLatestRecommendations();
                } catch (error) {
                    showNotification(error.message, 'error');
                } finally {
                    hideLoader();
                }
            });
        }

        // --- INITIAL PAGE LOAD ---
        await fetchAndDisplayGarden();
        displayLatestRecommendations();
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