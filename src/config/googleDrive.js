const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const CREDENTIALS_PATH = path.join(
    process.cwd(),
    "credentials.json"
);

const TOKEN_PATH = path.join(
    process.cwd(),
    "token.json"
);

const SCOPES = [
    "https://www.googleapis.com/auth/drive.file"
];

const getOAuth2Client = () => {

    const credentials = JSON.parse(
        fs.readFileSync(CREDENTIALS_PATH, "utf-8")
    );

    const { client_id, client_secret, redirect_uris } =
        credentials.web;

    const oauth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
    );

    return oauth2Client;
};

const getAuthorizationUrl = () => {

    const oauth2Client = getOAuth2Client();

    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent"
    });
};

const getTokensFromCode = async (code) => {

    const oauth2Client = getOAuth2Client();

    const { tokens } =
        await oauth2Client.getToken(code);

    fs.writeFileSync(
        TOKEN_PATH,
        JSON.stringify(tokens, null, 2)
    );

    return tokens;
};

const getGoogleDrive = () => {

    if (!fs.existsSync(TOKEN_PATH)) {
        throw new Error(
            "Google Drive is not authorized yet"
        );
    }

    const oauth2Client = getOAuth2Client();

    const tokens = JSON.parse(
        fs.readFileSync(TOKEN_PATH, "utf-8")
    );

    oauth2Client.setCredentials(tokens);

    return google.drive({
        version: "v3",
        auth: oauth2Client
    });
};

module.exports = {
    getAuthorizationUrl,
    getTokensFromCode,
    getGoogleDrive
};