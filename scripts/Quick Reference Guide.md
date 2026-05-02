# Daily Development Workflow

###### \# 1. Open WSL Terminal

wsl



###### \# 2. Navigate to project

cd \~/faceless-digital-assets



###### \# 3. Install dependencies (if needed)

pnpm install



###### \# 4. Run dev server

pnpm run dev



###### \# 5. Run paperclip relay

./scripts/paperclip\_to\_make.sh



###### \# 6. Dry run (test without sending)

DRY\_RUN=true ./scripts/paperclip\_to\_make.sh



\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

## Bottom Line

Yes! After reboot: That's typically all you need to run. The pnpm install step is only necessary if you (or git) changed dependencies. Everything else is already set up and ready to go! 🚀



wsl

cd \~/faceless-digital-assets

pnpm run dev



\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

# Environment Variables (Optional)

###### \# Set custom config via environment

export PAPERCLIP\_API\_KEY="your-key"

export MAKE\_WEBHOOK\_URL="your-webhook"

./scripts/paperclip\_to\_make.sh





\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_





# Troubleshooting

###### \# Check script exists

ls -la scripts/paperclip\_to\_make.sh



###### \# Check permissions

chmod +x scripts/paperclip\_to\_make.sh



###### \# View logs

cat scripts/paperclip\_to\_make.state.json



\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

# Optional: Auto-Load Environment Variables

###### If you use custom env vars, add them to .bashrc so they persist:



\# Add to \~/.bashrc

echo 'export PAPERCLIP\_API\_KEY="pcp\_58e4109abf4ad87b516c5d3f5832d36b8842bfb5574a84e4"' >> \~/.bashrc

echo 'export MAKE\_WEBHOOK\_API\_KEY="68037izex2mhjvcdyoukps1bw5q9grafl4nt"' >> \~/.bashrc



\# Reload

source \~/.bashrc





