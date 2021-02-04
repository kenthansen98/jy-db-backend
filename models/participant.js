const mongoose = require("mongoose");

const schema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 2, 
    },
    age: {
        type: Number,
    },
});

module.exports = mongoose.model("Participant", schema);
