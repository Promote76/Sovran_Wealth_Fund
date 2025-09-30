"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Registration routes for SWF platform
const express_1 = require("express");
const storage_1 = require("./storage");
// Create Express router
const router = (0, express_1.Router)();
// Create new registration from landing page form
router.post('/api/register-interest', async (req, res) => {
    try {
        const { fullName, email, interestLevel, walletAddress, country, hearAboutUs, additionalInfo, newsletter, termsConditions } = req.body;
        // Check if email already exists
        const existingRegistration = await storage_1.storage.getRegistrationByEmail(email);
        if (existingRegistration) {
            return res.status(400).json({
                success: false,
                message: 'This email is already registered'
            });
        }
        // Create registration record
        const registrationData = {
            name: fullName,
            email,
            investmentInterest: interestLevel,
            walletAddress: walletAddress || null,
            country: country || null,
            hearAboutUs: hearAboutUs || null,
            additionalInfo: additionalInfo || null,
            subscribeToNewsletter: !!newsletter,
            agreeToTerms: !!termsConditions
        };
        const registration = await storage_1.storage.createRegistration(registrationData);
        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: registration
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during registration',
            error: error.message
        });
    }
});
// Admin-only routes below
function adminAuth(req, res, next) {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ error: 'Unauthorized access' });
    }
    next();
}
// Get all registrations (admin only)
router.get('/api/admin/registrations', adminAuth, async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const registrations = await storage_1.storage.getAllRegistrations(limit);
        return res.json({
            success: true,
            data: registrations
        });
    }
    catch (error) {
        console.error('Error fetching registrations:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch registrations',
            error: error.message
        });
    }
});
// Get specific registration by ID (admin only)
router.get('/api/admin/registrations/:id', adminAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const registration = await storage_1.storage.getRegistration(id);
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }
        return res.json({
            success: true,
            data: registration
        });
    }
    catch (error) {
        console.error('Error fetching registration:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch registration',
            error: error.message
        });
    }
});
// Update registration status (admin only)
router.patch('/api/admin/registrations/:id', adminAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updates = req.body;
        // Remove any fields that shouldn't be updated
        delete updates.id;
        delete updates.createdAt;
        const updatedRegistration = await storage_1.storage.updateRegistration(id, updates);
        if (!updatedRegistration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }
        return res.json({
            success: true,
            message: 'Registration updated successfully',
            data: updatedRegistration
        });
    }
    catch (error) {
        console.error('Error updating registration:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update registration',
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=registration-routes.js.map