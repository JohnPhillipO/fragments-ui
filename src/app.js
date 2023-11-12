// src/app.js

import { Auth, getUser } from "./auth";
import { createUserFragment, getUserFragments } from "./api";

async function init() {
  // Get our UI elements
  const userSection = document.querySelector("#user");
  const loginBtn = document.querySelector("#login");
  const logoutBtn = document.querySelector("#logout");

  // Main Action Buttons
  const actionButtonSection = document.querySelector("#actionButton");
  const createFragmentBtn = document.querySelector("#createFragment");
  const getFragmentBtn = document.querySelector("#getFragment");

  const userFragmentSection = document.querySelector("#userFragment");

  // Get our UI elements for creating a text fragment
  const fragmentSection = document.querySelector("#fragment");

  const addFragmentBtn = document.querySelector("#addFragment");
  const inputValue = document.querySelector("#message");
  const contentTypeSelection = document.querySelector("#contentType");

  // Wire up event handlers to deal with login and logout.
  loginBtn.onclick = () => {
    // Sign-in via the Amazon Cognito Hosted UI (requires redirects), see:
    // https://docs.amplify.aws/lib/auth/advanced/q/platform/js/#identity-pool-federation
    Auth.federatedSignIn();
  };
  logoutBtn.onclick = () => {
    // Sign-out of the Amazon Cognito Hosted UI (requires redirects), see:
    // https://docs.amplify.aws/lib/auth/emailpassword/q/platform/js/#sign-out
    Auth.signOut();
  };

  // See if we're signed in (i.e., we'll have a `user` object)
  const user = await getUser();
  if (!user) {
    // Disable the Logout button
    logoutBtn.disabled = true;
    return;
  }

  // Log the user info for debugging purposes
  console.log({ user });

  // Update the UI to welcome the user and unhide the fragment section
  userSection.hidden = false;

  // Show the user's username
  userSection.querySelector(".username").innerText = user.username;

  // Disable the Login button
  loginBtn.disabled = true;

  //##################################

  // Action Button:
  actionButtonSection.hidden = false;

  createFragmentBtn.onclick = () => {
    userFragmentSection.hidden = true;
    fragmentSection.hidden = false;
    createFragmentBtn.disabled = true;
    getFragmentBtn.disabled = false;
  };

  getFragmentBtn.onclick = () => {
    fragmentSection.hidden = true;
    userFragmentSection.hidden = false;
    getFragmentBtn.disabled = true;
    createFragmentBtn.disabled = false;
    getUserFragments(user);
  };

  //##################################

  // Creating Fragment:
  addFragmentBtn.onclick = () => {
    const message = inputValue.value;
    const contentType =
      contentTypeSelection.options[contentTypeSelection.selectedIndex]
        .textContent;
    createUserFragment(message, contentType);
  };
}

// Wait for the DOM to be ready, then start the app
addEventListener("DOMContentLoaded", init);
