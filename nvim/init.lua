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
    os.exit(1) end
end

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
local theme = require("plugins.theme") --(_Catppuccin_😼, Lualine)
-- Fuzzy Finder
local telescope = require("plugins.telescope") --(_Telescope Fuzzy Finder_🧐)
-- Syntax Highlighting
local treesitter = require("plugins.treesitter") --(_Treesitter_)
-- Autoparis and Autotags
local auto_tags = require("plugins.auto_tags") --(_Auto Close and Opens the tag_)
-- File Explorer
local neo_tree = require("plugins.neo_tree") --(_Neotree file explorer_)
-- =====================================================================

require("lazy").setup({
  
  theme, -- Including Theme ✅

  telescope, -- Including Telescope ✅
  
  treesitter, -- Including Treesitter ✅

  auto_tags, -- Including Autotags/pairs ✅
  
  neo_tree, -- Including Neo-Tree ✅

})
