// src/app.js

import { Auth, getUser } from "./auth";
import {
  createUserFragment,
  getUserFragments,
  populateFragmentList,
} from "./api";

async function init() {
  // Get our UI elements
  const userSection = document.querySelector("#user");
  const loginBtn = document.querySelector("#login");
  const logoutBtn = document.querySelector("#logout");

  // Main Action Buttons
  const actionButtonSection = document.querySelector("#actionButton");
  const createFragmentBtn = document.querySelector("#createFragment");
  const getFragmentBtn = document.querySelector("#getFragment");
  const deleteFragmentBtn = document.querySelector("#deleteFragment");
  const updateFragmentBtn = document.querySelector("#updateFragment");

  const userFragmentSection = document.querySelector("#userFragment");

  // Get our UI elements for creating a text fragment
  const fragmentSection = document.querySelector("#fragment");
  const addFragmentBtn = document.querySelector("#addFragment");
  const inputValue = document.querySelector("#message");
  const contentTypeSelection = document.querySelector("#contentType");

  // UI elements for deleting a fragment
  const deleteSection = document.querySelector("#deleteSection");
  const deleteAction = document.querySelector("#deleteAction");

  const imageInput = document.querySelector("#imageInput");
  const textInput = document.querySelector("#textInput");
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
    initViewSection(false);
    initDeleteSection(false);
    initUpdateSection(false);
    initCreateSection(true);
    deleteFragmentBtn.disabled = false;
    updateFragmentBtn.disabled = false;
    getFragmentBtn.disabled = false;
    createFragmentBtn.disabled = true;
  };

  getFragmentBtn.onclick = () => {
    initCreateSection(false);
    initDeleteSection(false);
    initUpdateSection(false);
    initViewSection(true);
    createFragmentBtn.disabled = false;
    deleteFragmentBtn.disabled = false;
    updateFragmentBtn.disabled = false;
    getFragmentBtn.disabled = true;
    const fragmentViewList = document.querySelector("#fragmentList");
    getUserFragments(user)
      .then((data) =>
        populateFragmentList(data.fragments, fragmentViewList, "view", user)
      )
      .catch((err) => console.error(err));
  };

  deleteFragmentBtn.onclick = () => {
    initCreateSection(false);
    initViewSection(false);
    initUpdateSection(false);
    initDeleteSection(true);
    getFragmentBtn.disabled = false;
    createFragmentBtn.disabled = false;
    updateFragmentBtn.disabled = false;
    deleteFragmentBtn.disabled = true;
    const fragmentDeleteList = document.querySelector("#fragmentListDelete");
    getUserFragments(user)
      .then((data) =>
        populateFragmentList(data.fragments, fragmentDeleteList, "delete", user)
      )
      .catch((err) => console.error(err));
  };

  // Update
  // Hide all sections (true) -> Un-hide update section (false)
  // Hide action buttons for update (updateAction)
  // Update UI elements
  const updateSection = document.querySelector("#updateSection");
  const updateAction = document.querySelector("#updateAction");
  const updateTextSection = document.querySelector("#updateText");
  const updateImageSection = document.querySelector("#updateImage");
  updateFragmentBtn.onclick = () => {
    initCreateSection(false);
    initViewSection(false);
    initDeleteSection(false);
    initUpdateSection(true);
    createFragmentBtn.disabled = false;
    getFragmentBtn.disabled = false;
    deleteFragmentBtn.disabled = false;
    updateFragmentBtn.disabled = true;
    // Update Fragment function:
    const fragmentUpdateList = document.querySelector("#fragmentListUpdate");
    getUserFragments(user)
      .then((data) =>
        populateFragmentList(data.fragments, fragmentUpdateList, "update", user)
      )
      .catch((err) => console.log(err));
  };

  const initUpdateSection = (unhide) => {
    updateSection.hidden = !unhide;
    updateAction.hidden = true;
    updateTextSection.hidden = true;
    updateImageSection.hidden = true;
    // Remove success message if user has created a fragment.
    const updateSuccess = document.querySelector("#updateSuccess");
    updateSuccess.innerHTML = "";
  };

  //##################################

  // Helper Functions
  const initCreateSection = (unhide) => {
    fragmentSection.hidden = !unhide;
    // Hide button until content type is set.
    textInput.hidden = true;
    imageInput.hidden = true;
    // Remove success message if user has created a fragment.
    const successMsg = document.querySelector("#successMsg");
    successMsg.innerHTML = "";
    // Set placeholder for select list
    // Create a new option element
    const optionPlaceholder = document.createElement("option");
    // Set attributes for the option element
    optionPlaceholder.value = "";
    optionPlaceholder.text = "Choose here";
    optionPlaceholder.selected = true;
    optionPlaceholder.disabled = true;
    optionPlaceholder.hidden = true;
    contentTypeSelection.appendChild(optionPlaceholder);

    // Reset/Clear both textarea or file input.
    resetMessage(true);
    resetMessage(false);
  };

  const initViewSection = (unhide) => {
    userFragmentSection.hidden = !unhide;
    const metadataTable = document.getElementById("metadataTable");
    metadataTable.hidden = true;
    const fragmentData = document.getElementById("fragmentData");
    fragmentData.hidden = true;
    const convertFragmentSection = document.querySelector("#convertFragment");
    convertFragmentSection.hidden = true;
  };

  const initDeleteSection = (unhide) => {
    deleteSection.hidden = !unhide;
    deleteAction.hidden = unhide;
  };

  function resetMessage(isText) {
    if (isText) {
      inputValue.value = "";
    } else {
      // Create a new file input element
      const newInput = document.createElement("input");
      newInput.type = "file";
      newInput.id = "messageFile";
      // Get the existing file input element
      const existingInput = document.getElementById("messageFile");
      // Replace the existing input with the new one
      existingInput.parentNode.replaceChild(newInput, existingInput);
    }
  }
  // #############################

  addFragmentBtn.disabled = true;

  // Creating Fragment:
  addFragmentBtn.onclick = () => {
    const selectedContentType =
      contentTypeSelection.options[contentTypeSelection.selectedIndex]
        .textContent;
    if (
      selectedContentType.startsWith("text/") ||
      selectedContentType.startsWith("application/")
    ) {
      const message = inputValue.value;
      resetMessage(true);
      createUserFragment(message, selectedContentType);
    } else if (selectedContentType.startsWith("image/")) {
      console.log(selectedContentType);
      const data = document.querySelector("#messageFile").files[0];
      if (selectedContentType != data.type) {
        alert(
          `MUST BE SAME TYPE: You sent a type of ${data.type} while the selected content type is ${selectedContentType}`
        );
        return;
      }
      if (data != null) {
        alert("File has been uploaded");
      } else {
        alert("File required!");
        return;
      }
      resetMessage(false);
      createUserFragment(data, data.type);
    }
  };

  contentTypeSelection.addEventListener("change", () => {
    addFragmentBtn.disabled = false;

    const selectedContentType =
      contentTypeSelection.options[contentTypeSelection.selectedIndex]
        .textContent;

    if (
      selectedContentType.startsWith("text/") ||
      selectedContentType.startsWith("application/")
    ) {
      imageInput.hidden = true;
      textInput.hidden = false;
      resetMessage(true);
    } else if (selectedContentType.startsWith("image/")) {
      textInput.hidden = true;
      imageInput.hidden = false;
      resetMessage(false);
    } else {
      textInput.hidden = true;
      imageInput.hidden = true;
    }

    const successMsg = document.querySelector("#successMsg");
    successMsg.innerHTML = "";
  });
}

// Wait for the DOM to be ready, then start the app
addEventListener("DOMContentLoaded", init);
