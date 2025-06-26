-- ~/.config/nvim/init.lua
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not (vim.uv or vim.loop).fs_stat(lazypath) then
  local lazyrepo = "https://github.com/folke/lazy.nvim.git"
  local out = vim.fn.system({ "git", "clone", "--filter=blob:none", "--branch=stable", lazyrepo, lazypath })
  if vim.v.shell_error ~= 0 then
    vim.api.nvim_echo({
      { "Failed to clone lazy.nvim:\n", "ErrorMsg" },
      { out,                            "WarningMsg" },
      { "\nPress any key to exit..." },
    }, true, {})
    vim.fn.getchar()
    os.exit(1)
  end
end
-- Keybindings Import
require("plugins.keybindings.tab_nav").setup()

vim.opt.rtp:prepend(lazypath)

-- Set leader key before lazy is loaded
vim.g.mapleader = " "
vim.g.maplocalleader = ","

-- Basic UI Settings
vim.opt.number = true
vim.opt.relativenumber = true
vim.opt.mouse = "a"
vim.opt.clipboard = { "unnamedplus", "unnamed" }
vim.opt.expandtab = true
vim.opt.shiftwidth = 2
vim.opt.tabstop = 2
vim.opt.termguicolors = true
--vim.out.clipboard = unnamedplus
--Diables storing the swap files
vim.opt.swapfile = false

vim.g.clipboard = {
  name = "wl-clipboard",
  copy = {
    ["+"] = "wl-copy",
    ["*"] = "wl-copy",
  },
  paste = {
    ["+"] = "wl-paste --no-newline",
    ["*"] = "wl-paste --no-newline",
  },
  cache_enabled = 0,
}

-- =====================================================================
--  UI AND MINIMAL TOOL CONFIGURATION
-- -----------------------------------
-- UI
local theme = require("plugins.theme")           --(_Catppuccin_😼, Lualine)
-- Fuzzy Finder
local telescope = require("plugins.telescope")   --(_Telescope Fuzzy Finder_🧐)
-- Syntax Highlighting
local treesitter = require("plugins.treesitter") --(_Treesitter_)
-- Autoparis and Autotags
local auto_tags = require("plugins.auto_tags")   --(_Auto Close and Opens the tag_)
-- File Explorer
local neo_tree = require("plugins.neo_tree")     --(_Neotree file explorer_)
-- =====================================================================

-- Nvim_lspconfig (LSP Installer and lpsconfig)
local nvim_lsp = require("plugins.lsp.nvim_lsp") --(_Mason installs Language Servers and configure them)

-- Linting and Formatting (Using null-ls)
local null_ls = require("plugins.lsp.none_ls") --(_Format & lints all type of language files)

-- Autocompletion
local autocomplete = require("plugins.autocompletion") --(_nvim-cmp & lua-snip_)

-- Lspsaga
local lspsaga = require("plugins.lsp.lsp_saga") --(_Gives super useful lsp functions_)

-- Lspkind
local lsp_kind = require("plugins.lsp.lsp_kind") --(_Gives Vscode like pictograms_)

-- Git-Config
local git_config = require("plugins.git_conf") --(_Vscode like Git functionalities_)

-- Buffer Line
local buffer_line = require("plugins.buffer_line") --(_Buffer line and open-tabs_)

require("lazy").setup({

  theme,     -- Including Theme ✅

  telescope, -- Including Telescope ✅

  treesitter, -- Including Treesitter ✅

  auto_tags, -- Including Autotags/pairs ✅

  neo_tree,  -- Including Neo-Tree ✅

  -----------------------------------------------------

  null_ls,     -- Including None-ls ✅

  nvim_lsp,    -- Including Mason Installer ✅

  autocomplete, -- Including Autocomplete ✅

  lspsaga,     -- Including Autocomplete ✅

  lsp_kind,    -- Including lsp_kind ✅

  git_config,  -- Including Git-config ✅

  buffer_line, -- Including Buffer-line ✅
})
