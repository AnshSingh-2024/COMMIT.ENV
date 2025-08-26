// HomeHarvest AI - JavaScript Functionality

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu functionality
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Smooth scroll only for hash links; allow normal navigation for page links
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href') || '';
            const isHash = href.startsWith('#');

            if (!isHash) {
                // Let the browser navigate to another page normally
                return;
            }

            // Handle in-page smooth scroll
            e.preventDefault();
            const targetSection = document.querySelector(href);
            if (targetSection) {
                if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                }
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                updateActiveNavLink(href);
            }
        });
    });

    // Update active navigation link based on scroll position
    function updateActiveNavLink(activeId) {
        navLinks.forEach(link => {
            link.classList.remove('text-green-600');
            link.classList.add('text-gray-700');
        });
        
        const activeLink = document.querySelector(`[href="${activeId}"]`);
        if (activeLink) {
            activeLink.classList.remove('text-gray-700');
            activeLink.classList.add('text-green-600');
        }
    }

    // Scroll spy functionality
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                updateActiveNavLink('#' + sectionId);
            }
        });
    });

    // File upload functionality for pantry
    const pantryUpload = document.getElementById('pantry-upload');
    const pantryPreview = document.getElementById('pantry-preview');
    const pantryImage = document.getElementById('pantry-image');
    const pantryUploadArea = pantryUpload ? pantryUpload.closest('.upload-area') : null;
    
    if (pantryUpload && pantryPreview && pantryImage && pantryUploadArea) {
        pantryUploadArea.addEventListener('click', function() {
            pantryUpload.click();
        });
        
        pantryUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    pantryImage.src = e.target.result;
                    pantryPreview.classList.remove('hidden');
                    pantryUploadArea.classList.add('upload-loading');
                    
                    // Simulate AI processing
                    setTimeout(() => {
                        pantryUploadArea.classList.remove('upload-loading');
                        showNotification('Pantry analyzed! Found 12 ingredients.', 'success');
                    }, 2000);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // File upload functionality for plants
    const plantUpload = document.getElementById('plant-upload');
    const plantPreview = document.getElementById('plant-preview');
    const plantImage = document.getElementById('plant-image');
    const plantUploadArea = plantUpload ? plantUpload.closest('.upload-area') : null;
    
    if (plantUpload && plantPreview && plantImage && plantUploadArea) {
        plantUploadArea.addEventListener('click', function() {
            plantUpload.click();
        });
        
        plantUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    plantImage.src = e.target.result;
                    plantPreview.classList.remove('hidden');
                    plantUploadArea.classList.add('upload-loading');
                    
                    // Simulate AI processing
                    setTimeout(() => {
                        plantUploadArea.classList.remove('upload-loading');
                        showNotification('Plant analyzed! Health assessment complete.', 'success');
                    }, 2000);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Notification system
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // Create notification element
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-600' : 'bg-blue-600';
        notification.className = `notification ${bgColor} fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
        const icon = type === 'success' ? '✓' : 'ℹ';
        
        notification.innerHTML = `
            <div class="flex items-center space-x-2 text-white">
                <span class="text-lg">${icon}</span>
                <span>${message}</span>
                <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }

    // CTA buttons on homepage are anchors; no JS needed

    // Interactive recipe suggestions (Kitchen page)
    (function attachRecipeClicks() {
        const isKitchenPage = /kitchen\.html$/i.test(location.pathname) || document.title.toLowerCase().includes('kitchen');
        if (!isKitchenPage) return;
        const recipeSectionCard = Array.from(document.querySelectorAll('.feature-card'))
            .find(c => (c.querySelector('h3')?.textContent || '').toLowerCase().includes('recipe suggestions'));
        if (!recipeSectionCard) return;
        const recipeCards = recipeSectionCard.querySelectorAll('.bg-green-50');
        recipeCards.forEach(card => {
            card.addEventListener('click', function() {
                const recipeName = this.querySelector('h4')?.textContent || 'Recipe';
                showNotification(`Recipe "${recipeName}" selected!`, 'success');
            });
        });
    })();

    // Interactive community features (Community page)
    (function attachCommunityInteractions() {
        const isCommunityPage = /community\.html$/i.test(location.pathname) || document.title.toLowerCase().includes('community');
        if (!isCommunityPage) return;
        const communityCards = document.querySelectorAll('.bg-green-50, .bg-blue-50, .bg-purple-50, .bg-orange-50');
        communityCards.forEach(card => {
            card.addEventListener('click', function() {
                const contentEl = this.querySelector('h4, .font-medium');
                const content = contentEl ? contentEl.textContent : 'Community feature';
                showNotification(`"${content}" - Feature coming soon!`, 'info');
            });
        });
    })();

    // Badge hover effects
    const badges = document.querySelectorAll('#community .grid .bg-yellow-50, #community .grid .bg-green-50, #community .grid .bg-blue-50, #community .grid .bg-purple-50');
    badges.forEach(badge => {
        badge.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1) rotate(5deg)';
        });
        
        badge.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotate(0deg)';
        });
    });

    // Care reminder interactions (Garden page)
    (function attachCareReminders() {
        const isGardenPage = /garden\.html$/i.test(location.pathname) || document.title.toLowerCase().includes('garden');
        if (!isGardenPage) return;
        const careCard = Array.from(document.querySelectorAll('.feature-card'))
            .find(c => (c.querySelector('h3')?.textContent || '').toLowerCase().includes('care reminders'));
        if (!careCard) return;
        const careReminders = careCard.querySelectorAll('.space-y-2 .flex');
        careReminders.forEach(reminder => {
            reminder.addEventListener('click', function() {
                const task = this.querySelector('span')?.textContent || 'Task';
                showNotification(`Marked "${task}" as completed!`, 'success');
                this.style.opacity = '0.5';
                this.style.textDecoration = 'line-through';
            });
        });
    })();

    // Add some interactive animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all feature cards for animation
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Initialize tooltips for better UX
    function initializeTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', function() {
                const tooltip = document.createElement('div');
                tooltip.className = 'absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg';
                tooltip.textContent = this.getAttribute('data-tooltip');
                tooltip.style.top = this.offsetTop - 30 + 'px';
                tooltip.style.left = this.offsetLeft + 'px';
                document.body.appendChild(tooltip);
                
                this.addEventListener('mouseleave', function() {
                    tooltip.remove();
                });
            });
        });
    }

    // Initialize tooltips
    initializeTooltips();

    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close mobile menu
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
        }
    });

    console.log('HomeHarvest AI - Website loaded successfully! 🌱');

    document.addEventListener('DOMContentLoaded', function() {
        const isKitchenPage = /kitchen\.html$/i.test(location.pathname) || document.title.toLowerCase().includes('kitchen');
        if (!isKitchenPage) return;
    
        const storageKey = 'homeharvest_prefs_v1';
        const loadPrefs = () => {
            try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { return {}; }
        };
        const savePrefs = (prefs) => localStorage.setItem(storageKey, JSON.stringify(prefs));
    
        const prefs = Object.assign({ difficulty: 'Easy', time: '30', purchaseExtras: false, mood: '', cuisine: '', servings: 2, diet: null }, loadPrefs());
    
        // Elements
        const difficultyGroup = document.getElementById('difficulty-group');
        const timeSelect = document.getElementById('time-available');
        const purchaseExtras = document.getElementById('purchase-extras');
        const moodInput = document.getElementById('mood');
        const cuisineInput = document.getElementById('cuisine');
        const servingsInput = document.getElementById('servings');
        const servingsDec = document.getElementById('servings-decrement');
        const servingsInc = document.getElementById('servings-increment');
        const summary = document.getElementById('prefs-summary');
        const generateBtn = document.getElementById('generate-recipes');
        const dietDisplay = document.getElementById('diet-display');
        const editDietBtn = document.getElementById('edit-diet-btn');
        const dietModal = document.getElementById('diet-modal');
        const dietSave = document.getElementById('diet-save');
        const dietCancel = document.getElementById('diet-cancel');
        const dietOptions = document.querySelectorAll('.diet-option');
    
        // Initialize UI
        const setActiveDifficulty = (value) => {
            if (!difficultyGroup) return;
            difficultyGroup.querySelectorAll('button').forEach(btn => {
                const isActive = btn.dataset.value === value;
                btn.classList.toggle('bg-green-600', isActive);
                btn.classList.toggle('text-white', isActive);
                btn.classList.toggle('text-gray-700', !isActive);
            });
        };
        setActiveDifficulty(prefs.difficulty);
        if (timeSelect) timeSelect.value = prefs.time;
        if (purchaseExtras) {
            purchaseExtras.checked = !!prefs.purchaseExtras;
            // style toggle knob
            const updateToggle = () => {
                const track = purchaseExtras.parentElement.querySelector('span');
                const knob = track.querySelector('span');
                if (purchaseExtras.checked) {
                    track.classList.remove('bg-gray-200');
                    track.classList.add('bg-green-500');
                    knob.style.transform = 'translateX(16px)';
                } else {
                    track.classList.add('bg-gray-200');
                    track.classList.remove('bg-green-500');
                    knob.style.transform = 'translateX(0px)';
                }
            };
            updateToggle();
            purchaseExtras.addEventListener('change', () => { prefs.purchaseExtras = purchaseExtras.checked; savePrefs(prefs); updateToggle(); renderSummary(); });
        }
        if (moodInput) moodInput.value = prefs.mood || '';
        if (cuisineInput) cuisineInput.value = prefs.cuisine || '';
        if (servingsInput) servingsInput.value = prefs.servings;
        if (dietDisplay) dietDisplay.textContent = prefs.diet ? prefs.diet : 'Not set';
    
        // Events
        if (difficultyGroup) {
            difficultyGroup.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-value]');
                if (!btn) return;
                prefs.difficulty = btn.dataset.value;
                savePrefs(prefs);
                setActiveDifficulty(prefs.difficulty);
                renderSummary();
            });
        }
        if (timeSelect) timeSelect.addEventListener('change', () => { prefs.time = timeSelect.value; savePrefs(prefs); renderSummary(); });
        if (moodInput) moodInput.addEventListener('input', () => { prefs.mood = moodInput.value; savePrefs(prefs); });
        if (cuisineInput) cuisineInput.addEventListener('input', () => { prefs.cuisine = cuisineInput.value; savePrefs(prefs); });
        if (servingsDec) servingsDec.addEventListener('click', () => { const v = Math.max(1, parseInt(servingsInput.value || '1', 10) - 1); servingsInput.value = v; prefs.servings = v; savePrefs(prefs); renderSummary(); });
        if (servingsInc) servingsInc.addEventListener('click', () => { const v = Math.max(1, parseInt(servingsInput.value || '1', 10) + 1); servingsInput.value = v; prefs.servings = v; savePrefs(prefs); renderSummary(); });
        if (servingsInput) servingsInput.addEventListener('change', () => { const v = Math.max(1, parseInt(servingsInput.value || '1', 10)); servingsInput.value = v; prefs.servings = v; savePrefs(prefs); renderSummary(); });
    
        // Diet modal handlers
        let pendingDiet = prefs.diet;
        const openDiet = () => { if (dietModal) { dietModal.classList.remove('hidden'); dietModal.classList.add('flex'); } };
        const closeDiet = () => { if (dietModal) { dietModal.classList.add('hidden'); dietModal.classList.remove('flex'); } };
        if (!prefs.diet) openDiet();
        if (editDietBtn) editDietBtn.addEventListener('click', openDiet);
        if (dietCancel) dietCancel.addEventListener('click', closeDiet);
        dietOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                dietOptions.forEach(o => o.classList.remove('ring-2','ring-green-500'));
                opt.classList.add('ring-2','ring-green-500');
                pendingDiet = opt.dataset.diet;
            });
        });
        if (dietSave) dietSave.addEventListener('click', () => {
            prefs.diet = pendingDiet || prefs.diet || 'Veg';
            savePrefs(prefs);
            if (dietDisplay) dietDisplay.textContent = prefs.diet;
            closeDiet();
            showNotification(`Diet set to ${prefs.diet}`, 'success');
        });
    
        function renderSummary() {
            if (!summary) return;
            summary.textContent = `Difficulty: ${prefs.difficulty} • Time: ${prefs.time} min • Extras: ${prefs.purchaseExtras ? 'Yes' : 'No'} • Servings: ${prefs.servings}`;
        }
        renderSummary();
    
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                const payload = {
                    difficulty: prefs.difficulty,
                    timeMinutes: parseInt(prefs.time, 10),
                    openToPurchaseExtras: !!prefs.purchaseExtras,
                    mood: (prefs.mood || '').trim() || null,
                    cuisine: (prefs.cuisine || '').trim() || null,
                    servingSize: prefs.servings,
                    diet: prefs.diet || 'Veg'
                };
                console.log('Recipe Maker payload →', payload);
                showNotification('Preferences saved. Ready to query AI Recipe Maker.', 'success');
            });
        }
    });


    

});
