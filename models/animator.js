const mongoose = require("mongoose");

const schema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 2
    },
    conversations: [{ type: String }],
});

module.exports = mongoose.model("Animator", schema);
