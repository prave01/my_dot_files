return {
  -- {
  --   { "EdenEast/nightfox.nvim" }
  -- },
  {
    "catppuccin/nvim",
    name = "catppuccin",
    priority = 1000,
    config = function()
      require("catppuccin").setup({
        flavour = "auto",
        background = {
          light = "latte",
          dark = "mocha",
        },
        transparent_background = true,
        integrations = {
          treesitter = true,
          native_lsp = {
            enabled = true,
            virtual_text = {
              errors = { "italic" },
              hints = { "italic" },
              warnings = { "italic" },
              information = { "italic" },
            },
            underlines = {
              errors = { "underline" },
              hints = { "underline" },
              warnings = { "underline" },
              information = { "underline" },
            },
          },

          coc_nvim = false,

          lsp_trouble = false,

          cmp = true,

          lsp_saga = true,

          gitgutter = false,

          gitsigns = false,

          telescope = true,

          nvimtree = false,

          dap = {

            enabled = false,

            enable_ui = false,
          },

          neotree = {

            enabled = false,

            show_root = true,

            transparent_panel = false,
          },

          which_key = false,

          indent_blankline = {

            enabled = true,

            colored_indent_levels = false,
          },

          dashboard = false,

          neogit = false,

          vim_sneak = false,

          fern = false,

          barbar = false,

          markdown = true,

          lightspeed = false,

          leap = false,

          ts_rainbow = false,

          hop = false,

          notify = true,

          telekasten = false,

          symbols_outline = false,

          mini = false,

          aerial = false,

          vimwiki = false,

          beacon = false,

          navic = {

            enabled = false,

            custom_bg = "NONE",
          },

          overseer = false,

          fidget = true,

          treesitter_context = false,
        },
        color_overrides = {
          all = {
            rosewater = "#f5e0dc",
            flamingo = "#f2cdcd",
            pink = "#f5c2e7",
            mauve = "#cba6f7",
            red = "#ed5353",
            maroon = "#eba0ac",
            peach = "#fab387",
            yellow = "#f9e2af",
            green = "#a6e3a1",
            teal = "#94e2d5",
            sky = "#89dceb",
            sapphire = "#74c7ec",
            blue = "#89b4fa",
            lavender = "#b4befe",
            text = "#cdd6f4",
            subtext1 = "#bac2de",
            subtext0 = "#a6adc8",
            overlay2 = "#9399b2",
            overlay1 = "#7f849c",
            overlay0 = "#6c7086",
            surface2 = "#585b70",
            surface1 = "#45475a",
            surface0 = "#313244",
            base = "#1e1e2e",
            mantle = "#181825",
            crust = "#11111b",
          },
        },
        custom_highlights = function(C)
          return {

            CmpItemKindSnippet = { fg = C.base, bg = C.mauve },

            CmpItemKindKeyword = { fg = C.base, bg = C.red },

            CmpItemKindText = { fg = C.base, bg = C.teal },

            CmpItemKindMethod = { fg = C.base, bg = C.blue },

            CmpItemKindConstructor = { fg = C.base, bg = C.blue },

            CmpItemKindFunction = { fg = C.base, bg = C.blue },

            CmpItemKindFolder = { fg = C.base, bg = C.blue },

            CmpItemKindModule = { fg = C.base, bg = C.blue },

            CmpItemKindConstant = { fg = C.base, bg = C.peach },

            CmpItemKindField = { fg = C.base, bg = C.green },

            CmpItemKindProperty = { fg = C.base, bg = C.green },

            CmpItemKindEnum = { fg = C.base, bg = C.green },

            CmpItemKindUnit = { fg = C.base, bg = C.green },

            CmpItemKindClass = { fg = C.base, bg = C.yellow },

            CmpItemKindVariable = { fg = C.base, bg = C.flamingo },

            CmpItemKindFile = { fg = C.base, bg = C.blue },

            CmpItemKindInterface = { fg = C.base, bg = C.yellow },

            CmpItemKindColor = { fg = C.base, bg = C.red },

            CmpItemKindReference = { fg = C.base, bg = C.red },

            CmpItemKindEnumMember = { fg = C.base, bg = C.red },

            CmpItemKindStruct = { fg = C.base, bg = C.blue },

            CmpItemKindValue = { fg = C.base, bg = C.peach },

            CmpItemKindEvent = { fg = C.base, bg = C.blue },

            CmpItemKindOperator = { fg = C.base, bg = C.blue },

            CmpItemKindTypeParameter = { fg = C.base, bg = C.blue },

            CmpItemKindCopilot = { fg = C.base, bg = C.teal },
          }
        end,
      })
      vim.cmd.colorscheme("catppuccin")
    end,
  },

  {
    "nvim-lualine/lualine.nvim",
    dependencies = { "nvim-tree/nvim-web-devicons" },
    config = function()
      require("lualine").setup({
        options = {
          icons_enabled = true,
          theme = "palenight",
          component_separators = { left = "", right = "" },
          section_separators = { left = "", right = "" },
          always_divide_middle = true,
          always_show_tabline = true,
          globalstatus = false,
          refresh = {
            statusline = 1000,
            tabline = 1000,
            winbar = 1000,
            refresh_time = 16, -- ~60fps
            events = {
              "WinEnter",
              "BufEnter",
              "BufWritePost",
              "SessionLoadPost",
              "FileChangedShellPost",
              "VimResized",
              "Filetype",
              "CursorMoved",
              "CursorMovedI",
              "ModeChanged",
            },
          },
          sections = {
            lualine_a = { "mode" },
            lualine_b = { "branch", "diff", "diagnostics" },
            lualine_c = { "filename" },
            lualine_x = { "encoding", "fileformat", "filetype" },
            lualine_y = { "progress" },
            lualine_z = { "location" },
          },
          inactive_sections = {
            lualine_a = {},
            lualine_b = {},
            lualine_c = { "filename" },
            lualine_x = { "location" },
            lualine_y = {},
            lualine_z = {},
          },
          tabline = {},
          winbar = {},
          inactive_winbar = {},
          extensions = {},
        },
      })
    end,
  },

  -- Smooth Scroll
  {
    "karb94/neoscroll.nvim",
    opts = {},
    config = function()
      require("neoscroll").setup({
        mappings = {
          "<C-u>",
          "<C-d>",
          "<C-b>",
          "<C-f>",
          "<C-y>",
          "<C-e>",
          "zt",
          "zz",
          "zb",
        },
        hide_cursor = true,
        stop_eof = true,
        easing_function = nil,
        respect_scrolloff = false,
        cursor_scrolls_alone = true,
        duration_multiplier = 1.0,
        easing = "linear",
        pre_hook = nil,
        post_hook = nil,
        performance_mode = false,
        ignored_events = {
          "WinScrolled",
          "CursorMoved",
        },
      })
    end,
  },
}
