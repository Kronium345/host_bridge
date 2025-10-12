class StarRating {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.maxStars = options.maxStars || 5;
        this.readOnly = options.readOnly || false;
        this.currentRating = options.currentRating || 0;
        this.onRatingChange = options.onRatingChange || null;
        this.onSubmit = options.onSubmit || null;

        if (this.container) {
            this.init();
        }
    }

    init() {
        this.container.innerHTML = this.generateHTML();
        this.bindEvents();
        this.updateDisplay();
    }

    generateHTML() {
        let starsHTML = '';
        for (let i = 1; i <= this.maxStars; i++) {
            starsHTML += `
                <input type="radio" id="star-${i}" name="rating" value="${i}" ${this.readOnly ? 'disabled' : ''}>
                <label for="star-${i}" class="star" data-value="${i}">
                    <i class="fas fa-star"></i>
                </label>
            `;
        }

        return `
            <div class="star-rating-widget">
                <div class="stars-container">
                    ${starsHTML}
                </div>
                <div class="rating-feedback" id="rating-feedback"></div>
                ${!this.readOnly ? `
                    <div class="rating-actions">
                        <textarea id="rating-comment" placeholder="Optional: Share your experience..." rows="3"></textarea>
                        <button type="button" id="submit-rating" class="btn-primary">Submit Rating</button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    bindEvents() {
        if (this.readOnly) return;

        // Star click events
        const labels = this.container.querySelectorAll('.star');
        labels.forEach(label => {
            label.addEventListener('click', (e) => {
                e.preventDefault();
                const rating = parseInt(label.dataset.value);
                this.setRating(rating);
            });

            label.addEventListener('mouseenter', (e) => {
                const rating = parseInt(label.dataset.value);
                this.highlightStars(rating);
            });
        });

        // Container mouse leave
        this.container.addEventListener('mouseleave', () => {
            this.updateDisplay();
        });

        // Submit button
        const submitBtn = this.container.querySelector('#submit-rating');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.submitRating();
            });
        }
    }

    setRating(rating) {
        this.currentRating = rating;
        this.updateDisplay();

        if (this.onRatingChange) {
            this.onRatingChange(rating);
        }

        // Update feedback text
        this.updateFeedback();
    }

    highlightStars(rating) {
        const labels = this.container.querySelectorAll('.star');
        labels.forEach((label, index) => {
            // index is 0-4, rating is 1-5
            // So if rating=4, we want to highlight stars 0,1,2,3 (which are stars 1,2,3,4)
            if (index < rating) {
                label.classList.add('active');
            } else {
                label.classList.remove('active');
            }
        });
    }

    updateDisplay() {
        const labels = this.container.querySelectorAll('.star');
        labels.forEach((label, index) => {
            if (index < this.currentRating) {
                label.classList.add('active');
            } else {
                label.classList.remove('active');
            }
        });
    }

    updateFeedback() {
        const feedback = this.container.querySelector('#rating-feedback');
        if (!feedback) return;

        const messages = {
            1: "Poor - Not satisfied at all",
            2: "Fair - Below expectations",
            3: "Good - Met expectations",
            4: "Very Good - Exceeded expectations",
            5: "Excellent - Outstanding experience"
        };

        feedback.textContent = messages[this.currentRating] || '';
    }

    async submitRating() {
        if (this.currentRating === 0) {
            if (window.toast) {
                window.toast('Please select a rating before submitting.', 'error');
            }
            return;
        }

        const comment = this.container.querySelector('#rating-comment')?.value || '';
        const submitBtn = this.container.querySelector('#submit-rating');

        // Show loading state
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
        }

        try {
            const ratingData = {
                rating: this.currentRating,
                comment: comment,
                timestamp: new Date().toISOString()
            };

            if (this.onSubmit) {
                await this.onSubmit(ratingData);
            } else {
                // Default: send to backend
                await this.sendToBackend(ratingData);
            }

            if (window.toast) {
                window.toast('Rating submitted successfully!', 'success');
            }

            // Clear form
            this.container.querySelector('#rating-comment').value = '';
            this.currentRating = 0;
            this.updateDisplay();

        } catch (error) {
            console.error('Error submitting rating:', error);
            if (window.toast) {
                window.toast('Failed to submit rating. Please try again.', 'error');
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Rating';
            }
        }
    }

    async sendToBackend(ratingData) {
        const response = await fetch('https://host-bridge.onrender.com/api/ratings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(ratingData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    // Static method to display read-only rating
    static displayRating(containerId, rating) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.className = `star ${i <= rating ? 'active' : ''}`;
            star.innerHTML = '<i class="fas fa-star"></i>';
            container.appendChild(star);
        }
    }
}

// Auto-initialize star ratings on page load
document.addEventListener('DOMContentLoaded', function () {
    // Initialize all star rating widgets
    const ratingWidgets = document.querySelectorAll('.star-rating-container');
    ratingWidgets.forEach(container => {
        const options = {
            maxStars: parseInt(container.dataset.maxStars) || 5,
            readOnly: container.dataset.readOnly === 'true',
            currentRating: parseInt(container.dataset.currentRating) || 0,
            onSubmit: async (ratingData) => {
                // Custom submit handler for each widget
                const targetId = container.dataset.targetId;
                const targetType = container.dataset.targetType; // 'operator', 'property', etc.

                const response = await fetch('https://host-bridge.onrender.com/api/ratings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...ratingData,
                        targetId: targetId,
                        targetType: targetType
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return await response.json();
            }
        };

        new StarRating(container.id, options);
    });

    // Display existing ratings
    const ratingDisplays = document.querySelectorAll('.rating-display');
    ratingDisplays.forEach(display => {
        const rating = parseFloat(display.dataset.rating) || 0;
        StarRating.displayRating(display.id, rating);
    });
});

// CSS Styles for star rating (add to your CSS file)
const starRatingCSS = `
.star-rating-widget {
    display: block;
    margin: 20px auto;
    text-align: center;
    max-width: 500px;
}

.stars-container {
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: 2px;
    margin-bottom: 15px;
}

.star-rating-widget input[type="radio"] {
    display: none;
}

.star-rating-widget .star {
    cursor: pointer;
    color: #ddd;
    font-size: 1.2em;
    transition: color 0.2s;
}

.star-rating-widget .star:hover,
.star-rating-widget .star.active {
    color: #ffd700;
}

.rating-feedback {
    font-size: 0.9em;
    color: #666;
    margin-bottom: 15px;
    min-height: 20px;
    text-align: center;
}

.rating-actions {
    margin-top: 15px;
    text-align: center;
    width: 100%;
}

.rating-actions textarea {
    width: 80%;
    max-width: 400px;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    resize: vertical;
    margin: 0 auto 15px auto;
    font-family: inherit;
    display: block;
    font-size: 14px;
}

.rating-actions button {
    padding: 12px 24px;
    background: #2E8B57;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
    display: block;
    margin: 0 auto;
    font-size: 16px;
    font-weight: 600;
}

.rating-actions button:hover {
    background: #228B22;
}

.rating-actions button:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.rating-display .star {
    color: #ddd;
    margin-right: 2px;
}

.rating-display .star.active {
    color: #ffd700;
}
`;

// Inject CSS if not already present
if (!document.getElementById('star-rating-styles')) {
    const style = document.createElement('style');
    style.id = 'star-rating-styles';
    style.textContent = starRatingCSS;
    document.head.appendChild(style);
}
