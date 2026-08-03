FROM apify/actor-node:22

COPY package*.json ./

RUN npm install --omit=dev --omit=optional \
    && echo "Installed npm packages:" \
    && (npm list --omit=dev --all || true) \
    && echo "Node.js version:" \
    && node --version

COPY . ./

RUN npm install --include=dev \
    && npm run build \
    && npm prune --omit=dev

CMD ["npm", "run", "start", "--silent"]
