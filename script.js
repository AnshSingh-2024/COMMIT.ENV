// HomeHarvest AI - JavaScript Functionality

document.addEventListener('DOMContentLoaded', async function () {
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

        themeToggleBtn.addEventListener('click', function () {
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

    function setSession(userData) {
        localStorage.setItem('homeHarvestUser', JSON.stringify(userData));
    }

    function getSession() {
        return JSON.parse(localStorage.getItem('homeHarvestUser'));
    }

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
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({email, password}),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.detail);
                setSession(data);
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
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({name, email, password, dietary_preference}),
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
        // --- DOM & STATE MANAGEMENT ---
        let currentRecipes = [];
        let recipeCurrentPage = 1;
        let recipeSearchTerm = '';
        let forumCurrentPage = 1;
        let forumSearchTerm = '';
        let searchDebounceTimer;

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
        const recipeSearchInput = document.getElementById('recipe-search-input');
        const forumSearchInput = document.getElementById('forum-search-input');
        const shareRecipeForm = document.getElementById('share-recipe-form');
        const leaderboardContainer = document.getElementById('leaderboard-container');
        const forumContainer = document.getElementById('forum-container');
        const askQuestionForm = document.getElementById('ask-question-form');
        const addAnswerForm = document.getElementById('add-answer-form');

        // --- HELPER FUNCTIONS ---
        const openModal = (modal) => modal && modal.classList.replace('hidden', 'flex');
        const closeModal = (modal) => modal && modal.classList.replace('flex', 'hidden');

        const addItem = (listId, placeholder) => {
            const list = document.getElementById(listId);
            if (!list) return;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'flex items-center gap-2';
            const baseClasses = "block w-full bg-offwhite-50 dark:bg-gray-700 border-gray-600 shadow-sm h-8 px-2 rounded";
            itemDiv.innerHTML = (placeholder === 'Ingredient Name')
                ? `<input type="text" placeholder="${placeholder}" class="${baseClasses} flex-grow ingredient-name"><input type="text" placeholder="Quantity" class="${baseClasses} flex-grow ingredient-qty"><button type="button" class="remove-item-btn text-red-500 font-bold text-xl">&times;</button>`
                : `<input type="text" placeholder="Step description" class="${baseClasses} flex-grow instruction-step"><button type="button" class="remove-item-btn text-red-500 font-bold text-xl">&times;</button>`;
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

        // --- DATA FETCHING & RENDERING ---
        const renderRecipes = (recipes) => {
            if (!recipesContainer) return;
            if (recipes.length === 0) {
                recipesContainer.innerHTML = '<p class="col-span-full">No community recipes shared yet. Be the first!</p>';
                return;
            }
            recipesContainer.innerHTML = recipes.map(recipe => {
                const isUpvoted = recipe.upvoted_by.includes(user.user_id);
                const canDelete = recipe.user_id === user.user_id || user.role === 'moderator';

                return `
                <div class="feature-card flex flex-col">
                    <h3 class="text-xl font-semibold">${recipe.recipe_name}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">by ${recipe.author_name}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-300 mt-2 flex-grow">${recipe.description.substring(0, 100)}...</p>
                    <div class="flex justify-between items-center mt-4">
                        <button data-recipe-id="${recipe._id}" data-is-upvoted="${isUpvoted}" class="upvote-btn text-gray-500 hover:text-green-500 flex items-center gap-1 transition-colors">
                            <svg class="w-5 h-5 ${isUpvoted ? 'text-green-500' : 'text-gray-400'}" fill="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
                            <span class="upvote-count">${recipe.upvotes}</span>
                        </button>
                        <div class="flex items-center gap-3">
                            ${canDelete ? `<button data-recipe-id="${recipe._id}" class="delete-recipe-btn text-xs text-red-500 hover:underline">Delete</button>` : ''}
                            <button data-recipe-id="${recipe._id}" class="view-recipe-btn text-green-600 hover:underline">View Recipe</button>
                        </div>
                    </div>
                </div>
            `
            }).join('');
        };
        const fetchAndDisplayRecipes = async (page = 1, search = '') => {
            if (!recipesContainer) return;
            recipesContainer.innerHTML = '<p class="col-span-full">Loading recipes...</p>';
            try {
                const response = await fetch(`${API_BASE_URL}/community/recipes?page=${page}&limit=9&search=${encodeURIComponent(search)}`);
                const data = await response.json();
                currentRecipes = data.items;
                renderRecipes(data.items);
                renderPaginationControls(data.total_pages, data.current_page, 'recipes-pagination-controls', fetchAndDisplayRecipes, search);
            } catch (error) {
                recipesContainer.innerHTML = '<p class="col-span-full text-red-500">Could not load recipes.</p>';
            }
        };
        const renderForumPosts = (posts) => {
            if (!forumContainer) return;
            if (posts.length === 0) {
                forumContainer.innerHTML = '<p class="text-center text-gray-500">No discussions yet. Be the first to ask a question!</p>';
                return;
            }
            forumContainer.innerHTML = posts.map(post => `
                <div class="feature-card !p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" data-post-id-wrapper="${post._id}">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">${post.title}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Asked by ${post.author_alias} &bull; ${post.answers.length} answers &bull; ${post.reports || 0} reports</p>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0">
                        <button data-post-id="${post._id}" class="report-post-btn text-xs text-red-500 hover:underline">Report</button>
                        ${user.role === 'moderator' ? `<button data-post-id="${post._id}" class="hide-post-btn text-xs text-blue-500 hover:underline">Hide</button>` : ''}
                        <button data-post='${JSON.stringify(post)}' class="view-post-btn bg-gray-200 dark:bg-gray-700 font-medium py-2 px-4 rounded-lg text-sm">View</button>
                    </div>
                </div>
            `).join('');
        };

        const fetchAndDisplayForum = async (page = 1, search = '') => {
            if (!forumContainer) return;
            forumContainer.innerHTML = '<p>Loading discussions...</p>';
            try {
                const response = await fetch(`${API_BASE_URL}/community/forum?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
                const data = await response.json();
                renderForumPosts(data.items);
                renderPaginationControls(data.total_pages, data.current_page, 'forum-pagination-controls', fetchAndDisplayForum, search);
            } catch (error) {
                forumContainer.innerHTML = '<p class="text-red-500">Could not load discussions.</p>';
            }
        };
        const renderPaginationControls = (totalPages, currentPage, containerId, callbackFn, currentSearch) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = '';
            if (totalPages <= 1) return;

            const createButton = (text, page, isDisabled = false) => {
                const btn = document.createElement('button');
                btn.innerHTML = text;
                btn.className = `px-3 py-1 rounded disabled:opacity-50 ${page === currentPage ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`;
                btn.disabled = isDisabled;
                if (!isDisabled) {
                    btn.addEventListener('click', () => callbackFn(page, currentSearch));
                }
                return btn;
            };

            container.appendChild(createButton('&laquo;', currentPage - 1, currentPage === 1));
            for (let i = 1; i <= totalPages; i++) {
                container.appendChild(createButton(i, i));
            }
            container.appendChild(createButton('&raquo;', currentPage + 1, currentPage === totalPages));
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

        const loadTabData = (tab) => {
            if (tab === 'recipes') fetchAndDisplayRecipes(recipeCurrentPage, recipeSearchTerm);
            else if (tab === 'forum') fetchAndDisplayForum(forumCurrentPage, forumSearchTerm);
            else if (tab === 'leaderboard') fetchAndDisplayLeaderboard();
        };

        recipeSearchInput?.addEventListener('input', (e) => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                recipeSearchTerm = e.target.value;
                recipeCurrentPage = 1;
                fetchAndDisplayRecipes(recipeCurrentPage, recipeSearchTerm);
            }, 500); // 500ms debounce
        });

        forumSearchInput?.addEventListener('input', (e) => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                forumSearchTerm = e.target.value;
                forumCurrentPage = 1;
                fetchAndDisplayForum(forumCurrentPage, forumSearchTerm);
            }, 500); // 500ms debounce
        });


        // --- EVENT LISTENERS ---
        tabs.forEach(tab => tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('text-green-600', 'border-green-500'));
            panels.forEach(p => p.classList.add('hidden'));
            tab.classList.add('text-green-600', 'border-green-500');
            const panel = document.getElementById(`${tab.dataset.tab}-panel`);
            if (panel) panel.classList.remove('hidden');
            loadTabData(tab.dataset.tab);
        }));

        document.getElementById('share-recipe-btn')?.addEventListener('click', () => {
            resetRecipeForm();
            openModal(modals.shareRecipe);
        });

        document.getElementById('ask-question-btn')?.addEventListener('click', () => {
            if (askQuestionForm) askQuestionForm.reset();
            openModal(modals.askQuestion);
        });

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
                quantity: div.querySelector('.ingredient-qty').value
            })).filter(i => i.name && i.quantity);
            const instructions = Array.from(document.querySelectorAll('#instructions-list > div')).map(div => div.querySelector('.instruction-step').value).filter(Boolean);
            const payload = {
                author_name: user.name,
                recipe_name: document.getElementById('recipe-name').value,
                description: document.getElementById('recipe-description').value,
                diet_type: document.getElementById('recipe-diet-type').value,
                ingredients,
                instructions
            };
            try {
                const response = await fetch(`${API_BASE_URL}/community/recipes/${user.user_id}`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
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

        askQuestionForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoader('Posting question...');
            const payload = {
                title: document.getElementById('question-title').value,
                content: document.getElementById('question-content').value
            };
            try {
                const response = await fetch(`${API_BASE_URL}/community/forum/${user.user_id}`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.detail);
                showNotification(data.message, 'success');
                closeModal(modals.askQuestion);
                fetchAndDisplayForum();
            } catch (error) {
                showNotification(error.message, 'error');
            } finally {
                hideLoader();
            }
        });

        addAnswerForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const postId = e.currentTarget.dataset.postId;
            const answerContent = document.getElementById('answer-content');
            if (!postId || !answerContent.value) return;
            showLoader('Submitting answer...');
            const payload = {content: answerContent.value};
            try {
                const response = await fetch(`${API_BASE_URL}/community/forum/${postId}/answer/${user.user_id}`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.detail);
                showNotification(data.message, 'success');
                answerContent.value = '';
                closeModal(modals.viewPost);
                fetchAndDisplayForum();
            } catch (error) {
                showNotification(error.message, 'error');
            } finally {
                hideLoader();
            }
        });

        document.body.addEventListener('click', async (e) => {
            const upvoteBtn = e.target.closest('.upvote-btn');
            const viewRecipeBtn = e.target.closest('.view-recipe-btn');
            const deleteRecipeBtn = e.target.closest('.delete-recipe-btn');
            const viewPostBtn = e.target.closest('.view-post-btn');
            const reportBtn = e.target.closest('.report-post-btn');
            const hideBtn = e.target.closest('.hide-post-btn');
            const reportAnswerBtn = e.target.closest('.report-answer-btn');
            const hideAnswerBtn = e.target.closest('.hide-answer-btn');
            const removePlantBtn = e.target.closest('.remove-plant-btn');
            if (removePlantBtn) {
                const plantId = removePlantBtn.dataset.plantId;
                if (confirm('Are you sure you want to remove this plant and all its history? This action cannot be undone.')) {
                    showLoader('Removing plant...');
                    try {
                        const response = await fetch(`${API_BASE_URL}/garden/plant/${plantId}/${user.user_id}`, {
                            method: 'DELETE'
                        });
                        const data = await response.json();
                        if (!response.ok) throw new Error(data.detail);

                        showNotification(data.message, 'success');
                        // Give immediate visual feedback by removing the card
                        e.target.closest('[data-plant-id-wrapper]').remove();
                    } catch (error) {
                        showNotification(error.message, 'error');
                    } finally {
                        hideLoader();
                    }
                }
            }

            if (upvoteBtn) {
                const recipeId = upvoteBtn.dataset.recipeId;
                let isUpvoted = upvoteBtn.dataset.isUpvoted === 'true';

                // Instantly update the button's look and count
                const countSpan = upvoteBtn.querySelector('.upvote-count');
                const svgIcon = upvoteBtn.querySelector('svg');
                let currentCount = parseInt(countSpan.textContent, 10);

                isUpvoted = !isUpvoted; // Toggle the state
                upvoteBtn.dataset.isUpvoted = isUpvoted;
                countSpan.textContent = isUpvoted ? currentCount + 1 : currentCount - 1;
                svgIcon.classList.toggle('text-green-500', isUpvoted);
                svgIcon.classList.toggle('text-gray-400', !isUpvoted);

                try {
                    // Send the request to the server in the background
                    const response = await fetch(`${API_BASE_URL}/community/recipes/${recipeId}/toggle_upvote/${user.user_id}`, {method: 'POST'});
                    if (!response.ok) {
                        throw new Error('Upvote failed on server');
                    }
                    // Refresh only the leaderboard
                    fetchAndDisplayLeaderboard();
                } catch (error) {
                    // If the server fails, revert the change and show an error
                    showNotification(error.message, 'error');
                    isUpvoted = !isUpvoted;
                    upvoteBtn.dataset.isUpvoted = isUpvoted;
                    countSpan.textContent = currentCount; // Revert to original count
                    svgIcon.classList.toggle('text-green-500', isUpvoted);
                    svgIcon.classList.toggle('text-gray-400', !isUpvoted);
                }
            }

            if (viewRecipeBtn) {
                const recipeId = viewRecipeBtn.dataset.recipeId;
                // Find the full recipe object from the array we already have
                const recipe = currentRecipes.find(r => r._id === recipeId);
                if (!recipe) return;

                const recipeFooter = document.getElementById('view-recipe-footer');

                document.getElementById('view-recipe-title').textContent = recipe.recipe_name;
                document.getElementById('view-recipe-author').textContent = `By ${recipe.author_name}`;
                document.getElementById('view-recipe-description').textContent = recipe.description;
                document.getElementById('view-recipe-ingredients').innerHTML = recipe.ingredients.map(i => `<li>${i.quantity} ${i.name}</li>`).join('');
                document.getElementById('view-recipe-instructions').innerHTML = recipe.instructions.map(s => `<li>${s}</li>`).join('');


                if (recipeFooter) {
                    recipeFooter.innerHTML = ''; // Clear previous button
                    const shoppingPayload = {"additionalProp1": {}};
                    recipe.ingredients.forEach(i => {
                        shoppingPayload.additionalProp1[i.name] = 1;
                    });

                    const shopBtn = document.createElement('button');
                    shopBtn.className = 'w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2';
                    shopBtn.innerHTML = `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path></svg> <span>Shop for Ingredients</span>`;
                    recipeFooter.appendChild(shopBtn);

                    shopBtn.addEventListener('click', async () => {
                        showLoader('Finding items on Amazon...');
                        try {
                            const response = await fetch(`${API_BASE_URL}/shopping`, {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify(shoppingPayload)
                            });
                            const data = await response.json();
                            if (!response.ok) throw new Error(data.detail || 'Failed to get shopping link.');
                            window.open(data.cart_url, '_blank');
                        } catch (error) {
                            showNotification(error.message, 'error');
                        } finally {
                            hideLoader();
                        }
                    });
                }
                openModal(modals.viewRecipe);
            }
            if (deleteRecipeBtn) {
                const recipeId = deleteRecipeBtn.dataset.recipeId;
                if (confirm('Are you sure you want to permanently delete this recipe? This will also remove all points awarded for it.')) {
                    showLoader('Deleting recipe...');
                    try {
                        const response = await fetch(`${API_BASE_URL}/community/recipes/${recipeId}/${user.user_id}`, {
                            method: 'DELETE'
                        });
                        const data = await response.json();
                        if (!response.ok) throw new Error(data.detail);

                        showNotification(data.message, 'success');
                        // Give immediate feedback by removing the card
                        e.target.closest('.feature-card').remove();
                        // Refresh the leaderboard to reflect point changes
                        fetchAndDisplayLeaderboard();
                    } catch (error) {
                        showNotification(error.message, 'error');
                    } finally {
                        hideLoader();
                    }
                }
            }
            if (viewPostBtn) {
                const post = JSON.parse(viewPostBtn.dataset.post);
                document.getElementById('view-post-title').textContent = post.title;
                document.getElementById('view-post-author').textContent = `Asked by ${post.author_alias}`;
                document.getElementById('view-post-content').innerHTML = `<p>${post.content.replace(/\n/g, '<br>')}</p>`;
                document.getElementById('view-post-answers').innerHTML = post.answers.length > 0
                    ? post.answers.map(ans => `
                        <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg" data-answer-id-wrapper="${ans.id}">
                            <p class="text-sm text-gray-500">${ans.author_alias} answered:</p>
                            <p>${ans.content.replace(/\n/g, '<br>')}</p>
                            <div class="text-xs text-gray-400 mt-2 flex items-center gap-2">
                                <span>${ans.reports || 0} reports</span>
                                &bull;
                                <button data-post-id="${post._id}" data-answer-id="${ans.id}" class="report-answer-btn text-red-500 hover:underline">Report</button>
                                ${user.role === 'moderator' ? `&bull; <button data-post-id="${post._id}" data-answer-id="${ans.id}" class="hide-answer-btn text-blue-500 hover:underline">Hide</button>` : ''}
                            </div>
                        </div>`).join('')
                    : '<p class="text-sm text-gray-500">No answers yet.</p>';
                if (addAnswerForm) addAnswerForm.dataset.postId = post._id;
                openModal(modals.viewPost);
            }
            if (reportBtn) {
                const postId = reportBtn.dataset.postId;
                if (confirm('Are you sure you want to report this post for review?')) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/community/forum/${postId}/report`, {method: 'POST'});
                        const data = await response.json();
                        if (!response.ok) throw new Error(data.detail);
                        showNotification(data.message, 'success');
                    } catch (error) {
                        showNotification(error.message, 'error');
                    }
                }
            }
            if (hideBtn) {
                const postId = hideBtn.dataset.postId;
                if (confirm('MODERATOR: Are you sure you want to hide this post from public view?')) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/community/forum/${postId}/hide/${user.user_id}`, {method: 'PUT'});
                        const data = await response.json();
                        if (!response.ok) throw new Error(data.detail);
                        showNotification(data.message, 'success');
                        e.target.closest('[data-post-id-wrapper]').remove();
                    } catch (error) {
                        showNotification(error.message, 'error');
                    }
                }
            }
            if (reportAnswerBtn) {
                const postId = reportAnswerBtn.dataset.postId;
                const answerId = reportAnswerBtn.dataset.answerId;
                if (confirm('Are you sure you want to report this answer for review?')) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/community/forum/${postId}/answer/${answerId}/report`, {method: 'POST'});
                        const data = await response.json();
                        if (!response.ok) throw new Error(data.detail);
                        showNotification(data.message, 'success');
                    } catch (error) {
                        showNotification(error.message, 'error');
                    }
                }
            }
            if (hideAnswerBtn) {
                const postId = hideAnswerBtn.dataset.postId;
                if (confirm('MODERATOR: Are you sure you want to hide this answer?')) {
                    const answerId = hideAnswerBtn.dataset.answerId;
                    try {
                        const response = await fetch(`${API_BASE_URL}/community/forum/${postId}/answer/${answerId}/hide/${user.user_id}`, {method: 'PUT'});
                        const data = await response.json();
                        if (!response.ok) throw new Error(data.detail);
                        showNotification(data.message, 'success');
                        e.target.closest('[data-answer-id-wrapper]').remove();
                    } catch (error) {
                        showNotification(error.message, 'error');
                    }
                }
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
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({current_password: currentPassword, new_password: newPassword}),
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
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({dietary_preference: newDiet}),
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

    let currentRecipes = [];
    let currentInventory = [];
    let mealPlan = {};
    let currentPantryFile = null;

    // --- DOM ELEMENT REFERENCES ---
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
    const mealPlannerContainer = document.getElementById('meal-planner-container');
    const savePlanBtn = document.getElementById('save-plan-btn');
    const shoppingListBtn = document.getElementById('shopping-list-btn');
    const recipeModal = document.getElementById('recipe-modal');
    const shoppingListModal = document.getElementById('shopping-list-modal');
    const removeDropZone = document.getElementById('remove-drop-zone');

    // --- UNIFIED MODAL & HELPER FUNCTIONS ---
    const openModal = (modal) => modal && modal.classList.replace('hidden', 'flex');
    const closeModal = (modal) => modal && modal.classList.replace('flex', 'hidden');

    // --- MEAL PLANNER LOGIC ---
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];

    const renderMealPlanner = () => {
        if (!mealPlannerContainer) return;
        let tableHtml = '<table class="w-full text-sm text-left table-fixed"><thead><tr class="border-b dark:border-gray-600"><th class="w-28 py-2 px-2"></th>';
        days.forEach(day => tableHtml += `<th class="py-2 px-2 text-center"><span class="hidden sm:inline">${day}</span><span class="sm:hidden">${day.substring(0,3)}</span></th>`);
        tableHtml += '</tr></thead><tbody>';
        mealTypes.forEach(mealType => {
            tableHtml += '<tr class="border-b dark:border-gray-600">';
            tableHtml += `<td class="font-bold p-2">${mealType}</td>`;
            days.forEach(day => {
                const planEntry = mealPlan[`${day}-${mealType}`];
                const mealKey = `${day}-${mealType}`;
                tableHtml += `
                    <td class="p-2 border-l dark:border-gray-600 align-top h-24 meal-slot" data-day="${day}" data-meal="${mealType}">
                        ${planEntry ? `<div class="bg-green-100 dark:bg-green-900/50 p-2 rounded text-xs cursor-pointer truncate" draggable="true" data-meal-key="${mealKey}" title="${planEntry.recipe_name}">${planEntry.recipe_name}</div>` : ''}
                    </td>`;
            });
            tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table>';
        mealPlannerContainer.innerHTML = tableHtml;
        addDropListeners();
        addDragListenersToPlannerItems();
    };

    const addDragListenersToPlannerItems = () => {
        document.querySelectorAll('[data-meal-key]').forEach(item => {
            item.setAttribute('draggable', true);
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('mealKey', e.target.dataset.mealKey);
                removeDropZone.classList.remove('hidden', 'translate-y-full');
            });
            item.addEventListener('dragend', () => {
                removeDropZone.classList.add('translate-y-full');
                setTimeout(() => removeDropZone.classList.add('hidden'), 300);
            });
        });
    };

    const addDragListeners = () => {
        document.querySelectorAll('#featured-recipes-container .feature-card').forEach(card => {
            card.setAttribute('draggable', true);
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('recipeIndex', e.target.dataset.recipeIndex);
                setTimeout(() => e.target.classList.add('opacity-50'), 0);
            });
            card.addEventListener('dragend', (e) => e.target.classList.remove('opacity-50'));
        });
    };

    const addDropListeners = () => {
        document.querySelectorAll('.meal-slot').forEach(slot => {
            slot.addEventListener('dragover', (e) => { e.preventDefault(); slot.classList.add('bg-green-50', 'dark:bg-gray-700'); });
            slot.addEventListener('dragleave', (e) => slot.classList.remove('bg-green-50', 'dark:bg-gray-700'));
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('bg-green-50', 'dark:bg-gray-700');

                const recipeIndex = e.dataTransfer.getData('recipeIndex');
                const movingMealKey = e.dataTransfer.getData('mealKey');
                const day = slot.dataset.day;
                const mealType = slot.dataset.meal;

                if (movingMealKey) {
                    const recipeToMove = mealPlan[movingMealKey];
                    delete mealPlan[movingMealKey];
                    mealPlan[`${day}-${mealType}`] = { ...recipeToMove, day_of_week: day, meal_type: mealType };
                } else if (recipeIndex) {
                    const recipe = currentRecipes[parseInt(recipeIndex, 10)];
                    if (!recipe) return;
                    mealPlan[`${day}-${mealType}`] = {
                        day_of_week: day, meal_type: mealType, recipe_name: recipe.name, ...recipe
                    };
                }
                renderMealPlanner();
            });
        });
    };

    const savePlan = async (showNotificationAfter = false) => {
        try {
            const payload = { user_id: user.user_id, entries: Object.values(mealPlan) };
            const response = await fetch(`${API_BASE_URL}/meal-plan/${user.user_id}`, {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail);
            if (showNotificationAfter) showNotification(data.message, 'success');
        } catch (error) { showNotification(error.message, 'error'); }
    };

    const fetchAndDisplayMealPlan = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/meal-plan/${user.user_id}`);
            const data = await response.json();
            mealPlan = {};
            if (data && data.entries) {
                data.entries.forEach(entry => {
                    mealPlan[`${entry.day_of_week}-${entry.meal_type}`] = entry;
                });
            }
            renderMealPlanner();
        } catch (error) {
            showNotification('Could not load your meal plan.', 'error');
            renderMealPlanner();
        }
    };

    const openRecipeModal = (recipe) => {
        if (!recipe) return;
        document.getElementById('recipe-modal-title').textContent = recipe.name || recipe.recipe_name;
        document.getElementById('recipe-modal-description').textContent = recipe.description;
        document.getElementById('recipe-modal-prep-time').textContent = `Prep: ${recipe.prep_time_minutes} min`;
        document.getElementById('recipe-modal-cook-time').textContent = `Cook: ${recipe.cook_time_minutes} min`;
        document.getElementById('recipe-modal-instructions').innerHTML = recipe.instructions.map(step => `<li>${step}</li>`).join('');
        const nutritionContainer = document.getElementById('recipe-modal-nutrition');
        if (nutritionContainer && recipe.nutritional_info) {
            nutritionContainer.innerHTML = `
                <div><p class="font-bold">${recipe.nutritional_info.calories || 'N/A'}</p><p class="text-xs text-gray-500">Calories</p></div>
                <div><p class="font-bold">${recipe.nutritional_info.protein || 'N/A'}</p><p class="text-xs text-gray-500">Protein</p></div>
                <div><p class="font-bold">${recipe.nutritional_info.carbs || 'N/A'}</p><p class="text-xs text-gray-500">Carbs</p></div>
                <div><p class="font-bold">${recipe.nutritional_info.fats || 'N/A'}</p><p class="text-xs text-gray-500">Fats</p></div>`;
        } else if (nutritionContainer) {
             nutritionContainer.innerHTML = '<p class="col-span-full text-sm text-gray-500">Nutritional information not available.</p>';
        }
        const inventoryItemNamesLower = currentInventory.map(item => item.item_name.toLowerCase());
        const missingIngredientStrings = [];
        document.getElementById('recipe-modal-ingredients').innerHTML = recipe.ingredients.map(descriptiveIngredient => {
            const descriptiveIngredientLower = descriptiveIngredient.toLowerCase();
            const foundInInventory = inventoryItemNamesLower.some(inventoryItem => descriptiveIngredientLower.includes(inventoryItem));
            if (foundInInventory) return `<li class="text-green-700 dark:text-green-400">${descriptiveIngredient} (In Stock)</li>`;
            else {
                missingIngredientStrings.push(descriptiveIngredient);
                return `<li class="text-red-700 dark:text-red-400">${descriptiveIngredient} (Missing)</li>`;
            }
        }).join('');
        const recipeFooter = document.getElementById('recipe-modal-footer');
        recipeFooter.innerHTML = '';
        if (missingIngredientStrings.length > 0) {
            const shopBtn = document.createElement('button');
            shopBtn.id = 'shop-missing-btn';
            shopBtn.className = 'w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2';
            shopBtn.innerHTML = `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path></svg><span>Add Missing to Cart</span>`;
            recipeFooter.appendChild(shopBtn);
            shopBtn.addEventListener('click', async () => {
                shopBtn.disabled = true;
                shopBtn.innerHTML = '<span>Processing...</span>';
                try {
                    const cleanResponse = await fetch(`${API_BASE_URL}/clean-ingredients`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ingredients: missingIngredientStrings }) });
                    const cleanedItems = await cleanResponse.json();
                    if (!cleanResponse.ok) throw new Error('Failed to parse ingredients for shopping.');
                    shopBtn.innerHTML = '<span>Generating Link...</span>';
                    const shoppingResponse = await fetch(`${API_BASE_URL}/shopping`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ "additionalProp1": cleanedItems }) });
                    const shoppingData = await shoppingResponse.json();
                    if (!shoppingResponse.ok) {
                        let detailMessage = shoppingData.detail;
                        if (typeof detailMessage === 'object' && detailMessage !== null && detailMessage.error) { throw new Error(detailMessage.error); }
                        throw new Error(detailMessage || 'Failed to get shopping link');
                    }
                    window.open(shoppingData.cart_url, '_blank');
                } catch(error) { showNotification(error.message, 'error'); }
                finally {
                    shopBtn.innerHTML = `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path></svg><span>Add Missing to Cart</span>`;
                    shopBtn.disabled = false;
                }
            });
        }
        openModal(recipeModal);
    };

    const displayRecipes = (recipes) => {
        if (!recipes || recipes.length === 0) {
            recipesContainer.innerHTML = `<div class="text-center py-10 px-6 bg-gray-50 dark:bg-gray-800 rounded-lg"><p class="text-gray-600 dark:text-gray-400">Set your preferences and click "Generate Recipes" to start!</p></div>`;
            return;
        }
        currentRecipes = recipes;
        recipesContainer.innerHTML = recipes.map((recipe, index) => `
        <div class="feature-card cursor-grab hover:border-green-500 dark:hover:border-green-400" draggable="true" data-recipe-index="${index}">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white pointer-events-none">${recipe.name}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 pointer-events-none">Prep: ${recipe.prep_time_minutes} min | Cook: ${recipe.cook_time_minutes} min</p>
        </div>`).join('');
        addDragListeners();
    };

    const fetchAndDisplayInventory = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/inventory/${user.user_id}`);
            const data = await response.json();
            currentInventory = (response.ok && data.items) ? data.items : [];
        } catch (error) {
            currentInventory = [];
            console.error("Error loading inventory:", error);
        } finally {
            if (currentInventory.length === 0) {
                inventoryContainer.innerHTML = `<p class="text-gray-500 dark:text-gray-400">Your inventory is empty.</p>`;
            } else {
                inventoryContainer.innerHTML = currentInventory.map(item => `
                <div class="flex justify-between items-center bg-green-50 dark:bg-green-900/50 p-2 rounded-lg animate-fade-in">
                    <span class="text-green-800 dark:text-green-200 font-medium flex-1 mr-2">${item.item_name}</span>
                    <div class="flex items-center">
                        <button data-item-name="${item.item_name}" data-change="-1" class="inventory-change-btn bg-green-200 dark:bg-green-800 hover:bg-green-300 dark:hover:bg-green-700 text-green-800 dark:text-green-100 font-bold w-6 h-6 rounded-full flex items-center justify-center">-</button>
                        <span class="w-10 text-center font-semibold">${item.quantity}</span>
                        <button data-item-name="${item.item_name}" data-change="1" class="inventory-change-btn bg-green-200 dark:bg-green-800 hover:bg-green-300 dark:hover:bg-green-700 text-green-800 dark:text-green-100 font-bold w-6 h-6 rounded-full flex items-center justify-center">+</button>
                    </div>
                </div>`).join('');
            }
        }
    };

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
        track.classList.toggle('bg-green-500', purchaseExtras.checked);
        track.classList.toggle('bg-gray-200', !purchaseExtras.checked);
        track.classList.toggle('dark:bg-gray-600', !purchaseExtras.checked);
    }

    // --- EVENT LISTENERS ---
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
            const response = await fetch(`${API_BASE_URL}/inventory/${user.user_id}`, {method: 'POST', body: formData});
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail);
            showNotification(data.message || 'Inventory updated!', 'success');
            await fetchAndDisplayInventory();
        } catch (error) { showNotification(error.message, 'error'); }
        finally { hideLoader(); pantryRemoveBtn.click(); }
    });
    inventoryContainer.addEventListener('click', async (e) => {
        const button = e.target.closest('.inventory-change-btn');
        if (!button) return;
        const itemName = button.dataset.itemName;
        const change = parseInt(button.dataset.change, 10);
        try {
            const response = await fetch(`${API_BASE_URL}/inventory/${user.user_id}/update-item`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({item_name: itemName, change: change}) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail);
            await fetchAndDisplayInventory();
        } catch (error) { showNotification(error.message, 'error'); }
    });
    recipesContainer.addEventListener('click', (e) => {
        const card = e.target.closest('[data-recipe-index]');
        if (card) {
            const recipeIndex = parseInt(card.dataset.recipeIndex, 10);
            openRecipeModal(currentRecipes[recipeIndex]);
        }
    });
    document.getElementById('recipe-modal-close')?.addEventListener('click', () => closeModal(recipeModal));
    recipeModal?.addEventListener('click', (e) => { if (e.target === recipeModal) closeModal(recipeModal); });
    document.getElementById('shopping-list-close-btn')?.addEventListener('click', () => closeModal(shoppingListModal));
    shoppingListModal?.addEventListener('click', (e) => { if (e.target === shoppingListModal) closeModal(shoppingListModal); });
    savePlanBtn.addEventListener('click', async () => { showLoader('Saving your plan...'); await savePlan(true); hideLoader(); });
    mealPlannerContainer.addEventListener('click', (e) => {
        const mealItem = e.target.closest('[data-meal-key]');
        if (mealItem) {
            const mealKey = mealItem.dataset.mealKey;
            const recipe = mealPlan[mealKey];
            if (recipe) openRecipeModal(recipe);
        }
    });
    removeDropZone.addEventListener('dragover', (e) => { e.preventDefault(); removeDropZone.classList.add('bg-red-700'); });
    removeDropZone.addEventListener('dragleave', () => removeDropZone.classList.remove('bg-red-700'));
    removeDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        const mealKey = e.dataTransfer.getData('mealKey');
        if (mealPlan[mealKey]) {
            delete mealPlan[mealKey];
            renderMealPlanner();
            savePlan();
            showNotification('Meal removed from plan.', 'info');
        }
        removeDropZone.classList.add('translate-y-full');
        setTimeout(() => removeDropZone.classList.add('hidden'), 300);
    });
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
            const response = await fetch(`${API_BASE_URL}/user/${user.user_id}/update`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({dietary_preference: newDiet})});
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail);
            showNotification('Diet preference saved!', 'success');
        } catch (error) { showNotification(error.message, 'error'); }
    });
    generateBtn.addEventListener('click', async () => {
        savePreferences();
        const payload = { Difficulty: document.querySelector('#difficulty-group .bg-green-600')?.dataset.value, TimeAvailable: parseInt(timeSelect.value), Shopping: purchaseExtras.checked, Cuisine: cuisineInput.value || 'Any', Serving: parseInt(servingsInput.value), Diet: dietSelector.value };
        showLoader('Generating your recipes...');
         try {
            const response = await fetch(`${API_BASE_URL}/recipes/${user.user_id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail);
            displayRecipes(data.Recipes);
         } catch(error) { showNotification(error.message, 'error'); }
         finally { hideLoader(); }
    });

    // The missing event listener is restored here
    shoppingListBtn.addEventListener('click', async () => {
        showLoader('Generating your smart list...');
        try {
            const response = await fetch(`${API_BASE_URL}/shopping-list/${user.user_id}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail);
            const shoppingListContent = document.getElementById('shopping-list-content');
            const shoppingListFooter = document.getElementById('shopping-list-footer');
            const listItems = Object.entries(data.shopping_list);
            if (listItems.length === 0) {
                shoppingListContent.innerHTML = '<p>Your shopping list is empty! Your inventory covers all planned meals.</p>';
                shoppingListFooter.innerHTML = '';
            } else {
                shoppingListContent.innerHTML = '<ul class="list-disc list-inside space-y-2">' + listItems.map(([item, qty]) => `<li>${item}</li>`).join('') + '</ul>';
                shoppingListFooter.innerHTML = `<button id="shop-shopping-list-btn" class="w-full bg-blue-600 text-white font-medium py-2 rounded-lg">Add to Amazon Cart</button>`;
                document.getElementById('shop-shopping-list-btn').addEventListener('click', async () => {
                    showLoader('Generating Amazon link...');
                    try {
                        const shopResponse = await fetch(`${API_BASE_URL}/shopping`, {
                            method: 'POST', headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({"additionalProp1": data.shopping_list})
                        });
                        const shopData = await shopResponse.json();
                        if (!shopResponse.ok) throw new Error(shopData.detail);
                        window.open(shopData.cart_url, '_blank');
                    } catch (err) {
                        showNotification(err.message, 'error');
                    } finally { hideLoader(); }
                });
            }
            openModal(shoppingListModal);
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            hideLoader();
        }
    });

    // --- INITIAL PAGE LOAD ---
    loadPreferences();
    const savedRecipes = JSON.parse(sessionStorage.getItem('lastGeneratedRecipes'));
    if (savedRecipes) {
        displayRecipes(savedRecipes);
    }
    await fetchAndDisplayInventory();
    await fetchAndDisplayMealPlan();
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
        // --- DOM ELEMENT REFERENCES ---
        const gardenContainer = document.getElementById('garden-container');
        const gardenPlaceholder = document.getElementById('garden-placeholder');
        const careRemindersContainer = document.getElementById('care-reminders-container');
        const remindersPlaceholder = document.getElementById('reminders-placeholder');
        const addPlantModal = document.getElementById('add-plant-modal');
        const detailsModal = document.getElementById('plant-details-modal');
        const guideModal = document.getElementById('guide-modal');
        const addPlantForm = document.getElementById('add-plant-form');
        const diagnoseForm = document.getElementById('diagnose-plant-form');
        const guideModalTitle = document.getElementById('guide-modal-title');
        const guideModalSteps = document.getElementById('guide-modal-steps');
        const chatForm = document.getElementById('chat-form');
        const chatInput = document.getElementById('chat-input');
        const chatWindow = document.getElementById('chat-window');

        // --- HELPER FUNCTIONS ---
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
        const addSafeListener = (selector, event, handler) => {
            const element = document.getElementById(selector);
            if (element) {
                element.addEventListener(event, handler);
            }
        };
        function markdownToHtml(text) {
            if (!text) return '';
            // Use the powerful 'marked' library to correctly parse the markdown
            return marked.parse(text);
        }
        const addChatMessage = (message, sender, elementId = null) => {
            if (!chatWindow) return;
            const messageWrapper = document.createElement('div');
            const messageBubble = document.createElement('div');

            messageWrapper.className = `w-full flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
            messageBubble.className = `prose dark:prose-invert max-w-xs md:max-w-md rounded-lg px-4 py-2 ${sender === 'user' ? 'bg-green-500 text-white' : 'bg-gray-200  dark:bg-gray-600'}`;

            if (elementId) messageBubble.id = elementId;
            messageBubble.innerHTML = message;
            messageWrapper.appendChild(messageBubble);
            chatWindow.appendChild(messageWrapper);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        };

        // --- DATA FETCHING & DISPLAY ---
        const fetchAndDisplayGarden = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/garden/${user.user_id}`);
                if (!response.ok) throw new Error('Could not fetch garden data.');
                currentPlants = await response.json();

                if (gardenContainer && gardenPlaceholder) {
                    gardenContainer.innerHTML = '';
                    if (currentPlants.length === 0) {
                        gardenContainer.appendChild(gardenPlaceholder);
                        gardenPlaceholder.classList.remove('hidden');
                    } else {
                        gardenPlaceholder.classList.add('hidden');
                        currentPlants.forEach(plant => {
                            const latestHistory = plant.history[plant.history.length - 1];
                            const card = document.createElement('div');
                            card.className = 'feature-card text-center relative'; // Added relative positioning
                            card.dataset.plantIdWrapper = plant._id; // Wrapper for easy removal
                            card.innerHTML = `
                                <div class="cursor-pointer" data-plant-id="${plant._id}">
                                    <img src="${API_BASE_URL}/${latestHistory.image_path}" alt="${plant.plant_name}" class="w-full h-40 object-cover rounded-md mb-4">
                                    <h3 class="text-lg font-semibold">${plant.plant_name}</h3>
                                </div>
                                <button data-plant-id="${plant._id}" class="remove-plant-btn absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors text-xs font-bold">&times;</button>
                            `;
                            // Attach listener to the main div for opening the modal
                            card.querySelector('.cursor-pointer').addEventListener('click', () => openDetailsModal(plant._id));
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

            if (chatWindow) chatWindow.innerHTML = '<div class="text-center text-sm text-gray-500">Ask a question like "How can I get brighter flowers?"</div>';
            if (chatForm) chatForm.dataset.plantId = plantId;

            const detailsModalTitle = document.getElementById('details-modal-title');
            const historyContainer = document.getElementById('plant-history-container');
            if (detailsModalTitle) detailsModalTitle.textContent = plant.plant_name;
            if (diagnoseForm) diagnoseForm.dataset.plantId = plantId;
            if (historyContainer) {
                historyContainer.innerHTML = '';
                 [...plant.history].reverse().forEach(entry => {
                    const entryDate = new Date(entry.timestamp).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
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

        // --- EVENT LISTENERS ---
        addSafeListener('add-plant-btn', 'click', () => openModal(addPlantModal));
        addSafeListener('add-plant-cancel', 'click', () => closeModal(addPlantModal));
        addSafeListener('details-modal-close', 'click', () => closeModal(detailsModal));
        addSafeListener('guide-modal-close', 'click', () => closeModal(guideModal));
        if (addPlantModal) addPlantModal.addEventListener('click', (e) => { if (e.target === addPlantModal) closeModal(addPlantModal); });
        if (detailsModal) detailsModal.addEventListener('click', (e) => { if (e.target === detailsModal) closeModal(detailsModal); });
        if (guideModal) guideModal.addEventListener('click', (e) => { if (e.target === guideModal) closeModal(guideModal); });
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
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 45000);
                const formData = new FormData();
                formData.append('file', diagnoseImageInput.files[0]);
                showLoader('Analyzing your plant...');
                try {
                    const response = await fetch(`${API_BASE_URL}/garden/diagnose/${plantId}`, { method: 'POST', body: formData, signal: controller.signal });
                    clearTimeout(timeoutId);
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.detail);
                    showNotification(data.message, 'success');
                    diagnoseForm.reset();
                    closeModal(detailsModal);
                    await fetchAndDisplayGarden();
                    displayLatestRecommendations();
                } catch (error) {
                    if (error.name === 'AbortError') {
                        showNotification('The analysis timed out. Please try again.', 'error');
                    } else {
                        showNotification(error.message, 'error');
                    }
                } finally {
                    hideLoader();
                }
            });
        }

        if (chatForm) {
            chatForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const plantId = e.currentTarget.dataset.plantId;
                const userPrompt = chatInput.value.trim();
                if (!userPrompt || !plantId) return;

                addChatMessage(userPrompt, 'user');
                chatInput.value = '';
                chatInput.disabled = true;

                const aiMessageId = `ai-response-${Date.now()}`;
                addChatMessage('<span class="typing-cursor"></span>', 'ai', aiMessageId);
                const aiMessageElement = document.getElementById(aiMessageId);
                if (!aiMessageElement) return;

                try {
                    const response = await fetch(`${API_BASE_URL}/community/garden/chat/${plantId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: userPrompt })
                    });

                    if (!response.body) throw new Error("Streaming not supported.");

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    aiMessageElement.innerHTML = '';
                    let fullResponseText = '';

                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        fullResponseText += decoder.decode(value, { stream: true });
                        aiMessageElement.innerHTML = markdownToHtml(fullResponseText);
                        chatWindow.scrollTop = chatWindow.scrollHeight;
                    }
                } catch (error) {
                    aiMessageElement.textContent = `Error: ${error.message}`;
                    aiMessageElement.classList.add('text-red-500');
                } finally {
                    chatInput.disabled = false;
                    chatInput.focus();
                    chatWindow.scrollTop = chatWindow.scrollHeight;
                }
            });
        }
        document.body.addEventListener('click', async (e) => {
            const removePlantBtn = e.target.closest('.remove-plant-btn');

            if (removePlantBtn) {
                const plantId = removePlantBtn.dataset.plantId;
                if (confirm('Are you sure you want to remove this plant and all its history? This action cannot be undone.')) {
                    showLoader('Removing plant...');
                    try {
                        const response = await fetch(`${API_BASE_URL}/garden/plant/${plantId}/${user.user_id}`, {
                            method: 'DELETE'
                        });
                        const data = await response.json();
                        if (!response.ok) throw new Error(data.detail);

                        showNotification(data.message, 'success');
                        // Give immediate visual feedback by removing the card
                        e.target.closest('[data-plant-id-wrapper]').remove();
                    } catch (error) {
                        showNotification(error.message, 'error');
                    } finally {
                        hideLoader();
                    }
                }
            }
        });
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