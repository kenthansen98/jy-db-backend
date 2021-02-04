const mongoose = require("mongoose");

const schema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        minlength: 2,
    },
    participants: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Participant" },
    ],
    animators: [{ type: mongoose.Schema.Types.ObjectId, ref: "Animator" }],
});

module.exports = mongoose.model("Group", schema);
