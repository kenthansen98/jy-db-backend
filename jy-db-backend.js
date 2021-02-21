const { ApolloServer, gql, UserInputError } = require("apollo-server");
const mongoose = require("mongoose");
require("dotenv").config()

const Participant = require("./models/participant");
const Animator = require("./models/animator");
const Group = require("./models/group");

const MONGODB_URI = process.env.URI;

console.log("connecting to ", MONGODB_URI);

mongoose
    .connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
    })
    .then(() => {
        console.log("connected to MongoDB");
    })
    .catch((error) => {
        console.log("error connection to MongoDB:", error.message);
    });

const typeDefs = gql`
    type Participant {
        name: String!
        age: Int!
        id: ID!
    }

    type Animator {
        name: String!
        conversations: [String]
        id: ID!
    }

    type Group {
        name: String!
        participants: [Participant!]!
        animators: [Animator!]!
        id: ID!
    }

    input ParticipantInput {
        name: String
        age: Int
    }

    input AnimatorInput {
        name: String
        conversations: [String]
    }

    type Query {
        allGroups: [Group!]!
        findGroup(id: ID!): Group
    }

    type Mutation {
        addGroup(
            name: String!
            participants: [ParticipantInput]
            animators: [AnimatorInput!]!
        ) : Group
        editGroup(
            groupId: ID!
            name: String
            participants: [ParticipantInput]
            animators: [AnimatorInput]
        ) : Group
        deleteGroup(
            groupId: ID!
        ) : Group
        addConversation(
            animatorId: ID!
            summary: String!
        ) : Animator
        editConversation(
            animatorId: ID!
            summary: String!
            index: Int!
        ) : Animator
        deleteConversation(
            animatorId: ID!
            index: Int!
        ) : Animator
    }
`;

const resolvers = {
    Query: {
        allGroups: () => {
            return Group.find({});
        },
        findGroup: (root, args) => {
            return Group.findById(args.id);
        },
    },
    Group: {
        participants: async (root) => {
            const participants = root.participants.map((participant) => participant._id);
            return await Participant.find({'_id': { $in: participants }});
        }, 
        animators: async (root) => {
            const animators = root.animators.map((animator) => animator._id);
            return await Animator.find({'_id': { $in: animators }});
        },
    },
    Mutation: {
        addGroup: async (root, args) => {
            const parsedArgs = JSON.parse(JSON.stringify(args));
            const participants = parsedArgs.participants.map(
                (participant) =>
                    new Participant({
                        name: participant.name,
                        age: participant.age,
                    })
            );
            const animators = parsedArgs.animators.map(
                (animator) =>
                    new Animator({
                        name: animator.name, 
                        conversations: animator.conversations, 
                    })
            );
            const group = new Group({ 
                name: parsedArgs.name, 
                participants: participants, 
                animators: animators, 
             });

            try {
                await group.save();
                participants.forEach(async (participant) => await participant.save());
                animators.forEach(async (animator) => await animator.save());
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args,
                });
            }
            return group;
        },
        editGroup: async (root, args) => {
            const group = await Group.findById(args.groupId);
            if (!group) {
                return null;
            }
            if (args.name) {
                group.name = args.name;
            }
            const parsedArgs = JSON.parse(JSON.stringify(args));
            if (args.participants) {
                const participants = parsedArgs.participants.map(
                    (participant) =>
                        new Participant({
                            name: participant.name,
                            age: participant.age,
                        })
                );
                group.participants = participants;
            }
            if (args.animators) {
                const animators = parsedArgs.animators.map(
                    (animator) =>
                        new Animator({
                            name: animator.name, 
                            conversations: animator.conversations, 
                        })
                );
                group.animators = animators;
            }

            try {
                await group.save();
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args,
                });
            }
            return group;
        },
        deleteGroup: async (root, args) => {
            const group = await Group.findByIdAndDelete(args.groupId);
            if (!group) {
                return null;
            }
            return group;
        },
        addConversation: async (root, args) => {
            const animator = await Animator.findById(args.animatorId);

            if (!animator) {
                return null;
            }
            animator.conversations = animator.conversations.concat(args.summary);
            try {
                await animator.save();
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args,
                });
            }
            return animator;
        },
        editConversation: async (root, args) => {
            const animator = await Animator.findById(args.animatorId);
            if (!animator) {
                return null;
            }
            if (args.index < animator.conversations.length) {
                animator.conversations.splice(args.index, 1, args.summary);
            }
            try {
                await animator.save();
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args,
                });
            }
            return animator;
        },
        deleteConversation: async (root, args) => {
            const animator = await Animator.findById(args.animatorId);
            if (!animator) {
                return null;
            }
            animator.conversations.splice(args.index, 1);
            try {
                await animator.save();
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args, 
                });
            }
            return animator;
        },
    },
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
});

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`Server ready at ${url}`);
});
