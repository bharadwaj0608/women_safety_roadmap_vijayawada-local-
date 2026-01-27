// ENHANCED ROAD REVIEW MODAL - REPLACE THE EXISTING openRoadReviewModal FUNCTION WITH THIS

// Open Road Review Modal (for quick road ratings)
function openRoadReviewModal(roadId, roadName) {
    // Get existing ratings for this road to display review history
    const existingRatings = roadRatings.get(roadId) || [];

    const modal = document.createElement('div');
    modal.id = 'road-review-modal';
    modal.className = 'modal-overlay';

    // Build review history HTML
    let reviewHistoryHTML = '';
    if (existingRatings.length > 0) {
        reviewHistoryHTML = `
            <div class="review-history-section">
                <h3 style="margin-bottom: 15px; color: #333;">📝 Previous Reviews (${existingRatings.length})</h3>
                <div class="review-list" style="max-height: 200px; overflow-y: auto; margin-bottom: 20px;">
        `;

        existingRatings.forEach((review, index) => {
            const date = new Date(review.timestamp).toLocaleDateString();
            const dayStars = review.dayRating ? renderStars(review.dayRating) : 'N/A';
            const nightStars = review.nightRating ? renderStars(review.nightRating) : 'N/A';

            reviewHistoryHTML += `
                <div class="review-item" style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <strong>Review #${existingRatings.length - index}</strong>
                        <span style="color: #666; font-size: 12px;">${date}</span>
                    </div>
                    <div style="margin-bottom: 5px;">
                        <strong>Day:</strong> ${dayStars} ${review.dayRating ? `(${review.dayRating}/5)` : ''}
                    </div>
                    <div style="margin-bottom: 5px;">
                        <strong>Night:</strong> ${nightStars} ${review.nightRating ? `(${review.nightRating}/5)` : ''}
                    </div>
                    ${review.hasStreetLights !== null && review.hasStreetLights !== undefined ? `<div style="margin-bottom: 5px;"><strong>Street Lights:</strong> ${review.hasStreetLights ? '✅ Yes' : '❌ No'}</div>` : ''}
                    ${review.hasPopulationDensity !== null && review.hasPopulationDensity !== undefined ? `<div style="margin-bottom: 5px;"><strong>Population Density:</strong> ${review.hasPopulationDensity ? '✅ Yes' : '❌ No'}</div>` : ''}
                    ${review.comments ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; font-style: italic; color: #555;">"${review.comments}"</div>` : ''}
                </div>
            `;
        });

        reviewHistoryHTML += `
                </div>
            </div>
            <hr style="margin: 20px 0; border: none; border-top: 2px solid #e0e0e0;">
        `;
    }

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
                <h2>⭐ Rate Road: ${roadName}</h2>
                <button class="modal-close" onclick="closeModal('road-review-modal')">✖️</button>
            </div>
            <div class="modal-body">
                ${reviewHistoryHTML}
                
                <h3 style="margin-bottom: 15px; color: #333;">Add Your Review</h3>
                <form id="road-rating-form">
                    <div class="form-section">
                        <label class="form-label">☀️ Day Safety Rating</label>
                        <div class="star-rating" id="day-star-rating">
                            <span class="star" data-rating="1" data-type="day">★</span>
                            <span class="star" data-rating="2" data-type="day">★</span>
                            <span class="star" data-rating="3" data-type="day">★</span>
                            <span class="star" data-rating="4" data-type="day">★</span>
                            <span class="star" data-rating="5" data-type="day">★</span>
                        </div>
                        <input type="hidden" id="day-rating-value" name="dayRating">
                        <small class="form-hint">How safe is this road during the day?</small>
                    </div>
                    
                    <div class="form-section">
                        <label class="form-label">🌙 Night Safety Rating</label>
                        <div class="star-rating" id="night-star-rating">
                            <span class="star" data-rating="1" data-type="night">★</span>
                            <span class="star" data-rating="2" data-type="night">★</span>
                            <span class="star" data-rating="3" data-type="night">★</span>
                            <span class="star" data-rating="4" data-type="night">★</span>
                            <span class="star" data-rating="5" data-type="night">★</span>
                        </div>
                        <input type="hidden" id="night-rating-value" name="nightRating">
                        <small class="form-hint">How safe is this road at night?</small>
                    </div>
                    
                    <div class="form-section">
                        <label class="form-label">💡 Does the street contain street lights?</label>
                        <div class="yes-no-buttons" style="display: flex; gap: 10px;">
                            <button type="button" class="yn-btn" data-question="streetLights" data-value="true" style="flex: 1; padding: 10px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: bold;">✅ Yes</button>
                            <button type="button" class="yn-btn" data-question="streetLights" data-value="false" style="flex: 1; padding: 10px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: bold;">❌ No</button>
                        </div>
                        <input type="hidden" id="street-lights-value" name="hasStreetLights">
                    </div>
                    
                    <div class="form-section">
                        <label class="form-label">👥 Does the place have population density?</label>
                        <div class="yes-no-buttons" style="display: flex; gap: 10px;">
                            <button type="button" class="yn-btn" data-question="populationDensity" data-value="true" style="flex: 1; padding: 10px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: bold;">✅ Yes</button>
                            <button type="button" class="yn-btn" data-question="populationDensity" data-value="false" style="flex: 1; padding: 10px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: bold;">❌ No</button>
                        </div>
                        <input type="hidden" id="population-density-value" name="hasPopulationDensity">
                    </div>
                    
                    <div class="form-section">
                        <label class="form-label">Comments (Optional)</label>
                        <textarea name="comments" rows="3" placeholder="Share your experience with this road..."></textarea>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="closeModal('road-review-modal')">Cancel</button>
                        <button type="submit" class="btn-primary">Submit Rating</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add CSS for active state of yes/no buttons
    const style = document.createElement('style');
    style.textContent = `
        .yn-btn.active {
            background: #10b981 !important;
            color: white !important;
            border-color: #10b981 !important;
        }
    `;
    document.head.appendChild(style);

    // Setup day star rating
    const dayStars = modal.querySelectorAll('#day-star-rating .star');
    const dayRatingInput = modal.querySelector('#day-rating-value');

    dayStars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = star.getAttribute('data-rating');
            dayRatingInput.value = rating;

            dayStars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });

    // Setup night star rating
    const nightStars = modal.querySelectorAll('#night-star-rating .star');
    const nightRatingInput = modal.querySelector('#night-rating-value');

    nightStars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = star.getAttribute('data-rating');
            nightRatingInput.value = rating;

            nightStars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });

    // Setup yes/no buttons
    const ynButtons = modal.querySelectorAll('.yn-btn');
    ynButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const question = btn.getAttribute('data-question');
            const value = btn.getAttribute('data-value');

            // Remove active class from siblings
            const siblings = modal.querySelectorAll(`[data-question="${question}"]`);
            siblings.forEach(s => s.classList.remove('active'));

            // Add active class to clicked button
            btn.classList.add('active');

            // Set hidden input value
            if (question === 'streetLights') {
                modal.querySelector('#street-lights-value').value = value;
            } else if (question === 'populationDensity') {
                modal.querySelector('#population-density-value').value = value;
            }
        });
    });

    // Handle form submission
    modal.querySelector('#road-rating-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);

        const dayRating = parseInt(formData.get('dayRating'));
        const nightRating = parseInt(formData.get('nightRating'));

        // Validate that at least one rating is provided
        if (!dayRating && !nightRating) {
            alert('Please provide at least one rating (day or night)');
            return;
        }

        // Calculate overall rating (average of day and night, or single rating)
        let overallRating;
        if (dayRating && nightRating) {
            overallRating = (dayRating + nightRating) / 2;
        } else {
            overallRating = dayRating || nightRating;
        }

        const ratingData = {
            roadId: roadId,
            roadName: roadName,
            rating: overallRating,
            dayRating: dayRating || null,
            nightRating: nightRating || null,
            hasStreetLights: formData.get('hasStreetLights') ? formData.get('hasStreetLights') === 'true' : null,
            hasPopulationDensity: formData.get('hasPopulationDensity') ? formData.get('hasPopulationDensity') === 'true' : null,
            comments: formData.get('comments'),
            timestamp: new Date().toISOString()
        };

        console.log('=== ROAD RATING SUBMITTED ===');
        console.log(ratingData);

        // Add rating to in-memory storage for immediate UI update
        addRoadRating(roadId, ratingData);

        // Save to database
        try {
            const response = await fetch(`${API_URL}/road-ratings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ratingData)
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Rating saved to database:', result.data);
                showNotification('Road rating submitted successfully!');
            } else {
                console.error('❌ Failed to save rating:', result.error);
                showNotification('Rating saved locally but failed to sync to database');
            }
        } catch (error) {
            console.error('❌ Error saving rating to database:', error);
            showNotification('Rating saved locally but failed to sync to database');
        }

        closeModal('road-review-modal');
    });
}
