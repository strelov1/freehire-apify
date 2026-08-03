FROM apify/actor-node:22

# The repository pins dependencies with pnpm-lock.yaml, which npm does not read. Installing
# with npm here would re-resolve every dependency by semver on each build, so the image that
# ships could differ from the one that was tested. Corepack gives us the same pnpm the
# lockfile was written with.
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod \
    && echo "Node.js version:" \
    && node --version

COPY . ./

# Dev dependencies are needed to compile, then dropped from the shipped image.
RUN pnpm install --frozen-lockfile \
    && pnpm run build \
    && pnpm prune --prod

CMD ["pnpm", "run", "start", "--silent"]
