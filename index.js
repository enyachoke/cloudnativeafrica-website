require("dotenv").config()
const { Keystone } = require('@keystonejs/keystone');
const { PasswordAuthStrategy } = require('@keystonejs/auth-password');
const { Text, Checkbox, Password } = require('@keystonejs/fields');
const { GraphQLApp } = require('@keystonejs/app-graphql');
const { AdminUIApp } = require('@keystonejs/app-admin-ui');
const { NextApp } = require('@keystonejs/app-next');
const { StaticApp } = require('@keystonejs/app-static');
const initialiseData = require('./initial-data');

const { MongooseAdapter: Adapter } = require('@keystonejs/adapter-mongoose');
const PROJECT_NAME = 'cloudnative-site-api';
const adapterConfig = { mongoUri: process.env.DB_URL };


const PageSchema = require("./lists/Page")
const UserSchema = require("./lists/User")
const PostSchema = require("./lists/Post")
const TagSchema = require("./lists/Tag")
const CategorySchema = require("./lists/Category")

const DefaultAuthStrategy = require("./auth/Default.js")

// const keystone = new Keystone({
//   adapter: new Adapter(adapterConfig),
//   onConnect: process.env.CREATE_TABLES !== 'true' && initialiseData,
// });
const keystone = new Keystone({
  name: process.env.APP_NAME,
  cookieSecret: process.env.COOKIE_SECRET,
  adapter: new Adapter(adapterConfig),
  queryLimits: {
    maxTotalResults: 1000
  },
  onConnect: initialiseData
})

// Access control functions
const userIsAdmin = ({ authentication: { item: user } }) => Boolean(user && user.isAdmin);
const userOwnsItem = ({ authentication: { item: user } }) => {
  if (!user) {
    return false;
  }

  // Instead of a boolean, you can return a GraphQL query:
  // https://www.keystonejs.com/api/access-control#graphqlwhere
  return { id: user.id };
};

const userIsAdminOrOwner = auth => {
  const isAdmin = access.userIsAdmin(auth);
  const isOwner = access.userOwnsItem(auth);
  return isAdmin ? isAdmin : isOwner;
};

const access = { userIsAdmin, userOwnsItem, userIsAdminOrOwner };

// keystone.createList('User', {
//   fields: {
//     name: { type: Text },
//     email: {
//       type: Text,
//       isUnique: true,
//     },
//     isAdmin: {
//       type: Checkbox,
//       // Field-level access controls
//       // Here, we set more restrictive field access so a non-admin cannot make themselves admin.
//       access: {
//         update: access.userIsAdmin,
//       },
//     },
//     password: {
//       type: Password,
//     },
//   },
//   // List-level access controls
//   access: {
//     read: access.userIsAdminOrOwner,
//     update: access.userIsAdminOrOwner,
//     create: access.userIsAdmin,
//     delete: access.userIsAdmin,
//     auth: true,
//   },
// });
keystone.createList("Page", PageSchema)
keystone.createList("User", UserSchema)
keystone.createList("Post", PostSchema)
keystone.createList("Tag", TagSchema)
keystone.createList("Category", CategorySchema)
// const authStrategy = keystone.createAuthStrategy({
//   type: PasswordAuthStrategy,
//   list: 'User',
// });
const authStrategy = keystone.createAuthStrategy(DefaultAuthStrategy)
module.exports = {
  keystone,
  apps: [
    new GraphQLApp(),
    new AdminUIApp({
      name: PROJECT_NAME,
      enableDefaultRoute: false,
      authStrategy,
    }),
    new NextApp({ dir: 'next.js' }),
  ],
};
