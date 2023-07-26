const mongoose = require("mongoose")

const addressSchema = new mongoose.Schema({
    street: String,
    city: String,
})

// Eksempler på hvordan innhold i en database kan lages
const exampleSchema = new mongoose.Schema({
    name: String,
    age: {
        type: Number,
        min: 1,
        max: 100,
        validate: {
            validator: v => v % 2 === 0,
            message: props => `${props.value} is not an even number`,
        }
    },
    email: {
        type: String,               // beskriver type informasjon. Tilsvarer: email: String,
        minLength: 5,               // setter minimumslengde på input
        // required: true,             // gjør at email blir et obligatorisk felt
        lowercase: true,            // endrer tekst til lowercase
    },
    createdAt: {
        type: Date,
        immutable: true,            // hindrer at data kan endres
        default: () => Date.now()   // legger inn data automatisk
    },
    updatedAt: {
        type: Date,
        default: () => Date.now()
    },
    bestFriend: mongoose.SchemaTypes.ObjectId,
    hobbies: [String],              // array med tekst ["fotball", "håndball"] osv
    address1: {                     // Eksempel på direkte definisjon
        street: String,
        city: String,
    },
    address2: addressSchema,        // Eksempel på definisjon ved bruk av eget Schema
})

module.exports = mongoose.model("Example", exampleSchema)