function AppViewModel() {
    this.score = ko.observable(0);
    this.autoCountActive = ko.observable(false);
    this.multiplierActive = ko.observable(false);
    this.autoCountInterval = null;
    this.multiplierInterval = null;
    this.nextMultiplierThreshold = 1500; // Initial threshold for multiplier activation

    // Increment score function
    this.incrementScore = () => {
        const pointsToAdd = this.multiplierActive() ? 6 : 1; // Use multiplier if active
        this.score(this.score() + pointsToAdd);
        this.checkForAutoCount();
        this.checkForMultiplier();
    };

    // Toggle Automatic Clicking
    this.toggleAutoCount = () => {
        if (this.score() >= 120) { // Check if enough points to activate
            this.autoCountActive(!this.autoCountActive());
            const skillBox = document.getElementById('skill-box');
            skillBox.classList.toggle('active');

            if (this.autoCountActive()) {
                this.autoCountInterval = setInterval(() => {
                    this.score(this.score() + 1);
                }, 400);
            } else {
                clearInterval(this.autoCountInterval);
            }
        } else {
            alert('You need 120 points to activate this skill!');
        }
    };

    // Activate multiplier skill
    this.activateMultiplier = () => {
        if (this.score() >= this.nextMultiplierThreshold) { // Check if enough points to activate
            this.multiplierActive(true);
            const multiplierBox = document.getElementById('multiplier-box');
            multiplierBox.classList.add('active');

            // Set a timer for the multiplier duration
            this.multiplierInterval = setTimeout(() => {
                this.multiplierActive(false);
                multiplierBox.classList.remove('active');
                const currentScore = this.score();
                this.nextMultiplierThreshold = currentScore + 1500; // Set new threshold
                this.checkForMultiplier(); // Check if the button should disappear

                // Optional: Add a fade-out effect
                multiplierBox.style.animation = 'fade-out 1s forwards';
            }, 60000); // Active for 1 minute
        } else {
            alert(`You need ${this.nextMultiplierThreshold} points to activate this skill!`);
        }
    };

    // Check if multiplier box should appear
    this.checkForMultiplier = () => {
        const multiplierBox = document.getElementById('multiplier-container');
        if (this.score() >= this.nextMultiplierThreshold) {
            multiplierBox.style.display = 'block';
            multiplierBox.style.opacity = 1; // Fade in
        } else {
            multiplierBox.style.display = 'none';
        }
    };

    // Check if autoCount box should appear
    this.checkForAutoCount = () => {
        if (this.score() >= 120 && document.getElementById('auto-count-container').style.display === 'none') {
            document.getElementById('auto-count-container').style.display = 'block';
            setTimeout(() => {
                document.getElementById('auto-count-container').style.opacity = 1; // Fade in
            }, 10);
        }
    };

    // IndexedDB functions
    this.dbName = "clickerGameDB";
    this.storeName = "scores";

    this.initDB = () => {
        const request = indexedDB.open(this.dbName, 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore(this.storeName, { keyPath: "id" });
        };

        request.onsuccess = () => {
            this.loadScores();
        };
    };

    this.saveScore = (username) => {
        const dbRequest = indexedDB.open(this.dbName);
        dbRequest.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(this.storeName, "readwrite");
            const store = transaction.objectStore(this.storeName);
            const scoreEntry = {
                id: username, // Use username as the key
                username: username,
                score: this.score()
            };

            // Check if the user already exists
            store.get(username).onsuccess = (event) => {
                const existingEntry = event.target.result;
                if (existingEntry) {
                    // Update score if the new score is higher
                    if (this.score() > existingEntry.score) {
                        scoreEntry.score = this.score(); // Update to new score
                        store.put(scoreEntry);
                        alert('Score updated!');
                    } else {
                        alert('Your score must be higher than the previous score!');
                    }
                } else {
                    // Add new user if not exists
                    store.add(scoreEntry);
                    alert('Score saved!');
                }
            };

            transaction.onerror = () => {
                alert('Error saving score.');
            };
            transaction.oncomplete = () => {
                this.loadScores();
            };
        };
    };

    this.loadScores = () => {
        const dbRequest = indexedDB.open(this.dbName);
        dbRequest.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(this.storeName, "readonly");
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                this.displayScores(request.result);
            };
        };
    };

    this.displayScores = (scores) => {
        const rankingsContainer = document.getElementById('rankings-container');
        rankingsContainer.innerHTML = ''; // Clear existing scores
        scores.sort((a, b) => b.score - a.score); // Sort by score descending
        scores.forEach(score => {
            const div = document.createElement('div');
            div.textContent = `${score.username}: ${score.score}`;
            rankingsContainer.style.backgroundColor = "#ffff";
            rankingsContainer.style.padding = "10px";
            rankingsContainer.style.borderRadius = "15px";
            rankingsContainer.style.width = "460px";
            rankingsContainer.style.border = "2px solid rgb(124, 216, 124)";
            rankingsContainer.appendChild(div);
        });
    };

    // Modal functions
    this.openSaveModal = () => {
        document.getElementById('save-modal').style.display = 'block';
    };

    this.closeSaveModal = () => {
        document.getElementById('save-modal').style.display = 'none';
    };

    this.confirmSave = () => {
        const username = document.getElementById('username').value;
        if (username) {
            this.saveScore(username);
            this.closeSaveModal();
        } else {
            alert('Please enter a username!');
        }
    };

    this.initDB(); // Initialize IndexedDB
}

// Apply Knockout bindings
ko.applyBindings(new AppViewModel());



const button = document.getElementById('click-button');

button.addEventListener('click', (e) => {
    const wave = document.createElement('span');
    wave.className = 'wave'; // Create a new wave element
    button.appendChild(wave); // Append it to the button

    // Set wave position based on click
    wave.style.left = `${e.clientX - button.getBoundingClientRect().left - 75}px`; // Center wave
    wave.style.top = `${e.clientY - button.getBoundingClientRect().top - 75}px`; // Center wave

    // Trigger the animation
    setTimeout(() => {
        wave.remove(); // Remove wave after animation
    }, 600); // Match with animation duration
});