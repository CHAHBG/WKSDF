// Auth Controller
// Most auth logic is handled by Firebase Client SDK, but we might need some admin actions here

exports.getProfile = (req, res) => {
    res.json({ user: req.user });
};
