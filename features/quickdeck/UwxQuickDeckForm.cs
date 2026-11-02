// UWX RC38: one optional, native Windows companion window. No second browser or API client.
#if !LINUX
using System;
using System.Drawing;
using System.Windows.Forms;
using System.Text.Json;
using CefSharp; // Provides the native browser's ExecuteScriptAsync extension.

namespace VRCX
{
    internal sealed class UwxQuickDeckForm : Form
    {
        private static readonly Color BackgroundColor = Color.FromArgb(13, 18, 19);
        private static readonly Color SurfaceColor = Color.FromArgb(24, 32, 32);
        private static readonly Color TextColor = Color.FromArgb(226, 240, 236);
        private static readonly Color MutedColor = Color.FromArgb(145, 164, 158);
        private static readonly Color AccentColor = Color.FromArgb(71, 225, 151);
        private Label _friendsText = null!;
        private Label _worldText = null!;
        private CheckBox _pin = null!;
        private bool _saving;

        internal UwxQuickDeckForm()
        {
            Text = "UnderWeb X · QuickDeck";
            Width = 395;
            Height = 380;
            MinimumSize = new Size(355, 345);
            FormBorderStyle = FormBorderStyle.SizableToolWindow;
            ShowInTaskbar = true;
            MaximizeBox = false;
            MinimizeBox = true;
            StartPosition = FormStartPosition.Manual;
            Location = RestoreLocation();
            BackColor = BackgroundColor;
            ForeColor = TextColor;
            Font = new Font("Segoe UI", 9F);
            AutoScaleMode = AutoScaleMode.Dpi;
            TopMost = VRCXStorage.Instance.Get("UWX_QuickDeckPin") != "false";

            var layout = new TableLayoutPanel {
                Dock = DockStyle.Fill, BackColor = BackgroundColor, Padding = new Padding(14),
                ColumnCount = 1, RowCount = 5
            };
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 48));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 73));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 33));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 38));

            var header = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2 };
            header.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
            header.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 90));
            header.Controls.Add(new Label {
                Dock = DockStyle.Fill, Text = "UWX  /  QUICKDECK", ForeColor = AccentColor,
                Font = new Font("Segoe UI", 12F, FontStyle.Bold), TextAlign = ContentAlignment.MiddleLeft
            }, 0, 0);
            _pin = new CheckBox {
                Dock = DockStyle.Fill, Text = "Pin on top", Checked = TopMost,
                ForeColor = TextColor, CheckAlign = ContentAlignment.MiddleLeft
            };
            _pin.CheckedChanged += (_, _) => {
                if (_saving) return;
                TopMost = _pin.Checked;
                VRCXStorage.Instance.Set("UWX_QuickDeckPin", TopMost ? "true" : "false");
                VRCXStorage.Instance.Save();
            };
            header.Controls.Add(_pin, 1, 0);
            layout.Controls.Add(header, 0, 0);

            var status = new TableLayoutPanel {
                BackColor = SurfaceColor, Dock = DockStyle.Fill, Padding = new Padding(12, 9, 12, 6),
                ColumnCount = 1, RowCount = 2
            };
            status.RowStyles.Add(new RowStyle(SizeType.Absolute, 27));
            status.RowStyles.Add(new RowStyle(SizeType.Absolute, 24));
            _friendsText = new Label {
                ForeColor = TextColor, Dock = DockStyle.Fill,
                Font = new Font("Segoe UI", 10F, FontStyle.Bold), Text = "Friends online · —"
            };
            _worldText = new Label {
                ForeColor = MutedColor, Dock = DockStyle.Fill, AutoEllipsis = true,
                Text = "World · Waiting for UWX"
            };
            status.Controls.Add(_friendsText, 0, 0);
            status.Controls.Add(_worldText, 0, 1);
            layout.Controls.Add(status, 0, 1);

            layout.Controls.Add(new Label {
                Text = "QUICK ACTIONS", Dock = DockStyle.Fill, ForeColor = MutedColor,
                Font = new Font("Segoe UI", 8F, FontStyle.Bold),
                TextAlign = ContentAlignment.BottomLeft
            }, 0, 2);

            var grid = new TableLayoutPanel {
                Dock = DockStyle.Fill, ColumnCount = 3, RowCount = 2,
                Padding = new Padding(0, 10, 0, 3)
            };
            for (int i = 0; i < 3; i++)
                grid.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 33.333F));
            for (int i = 0; i < 2; i++)
                grid.RowStyles.Add(new RowStyle(SizeType.Percent, 50));
            AddAction(grid, "People", "uwx-people", 0, 0);
            AddAction(grid, "Worlds", "uwx-worlds", 1, 0);
            AddAction(grid, "Invites", "uwx-invites", 2, 0);
            AddAction(grid, "OSC Lab", "uwx-osc", 0, 1);
            AddAction(grid, "Search", "search", 1, 1);
            AddAction(grid, "Overview", "underweb", 2, 1);
            layout.Controls.Add(grid, 0, 3);

            layout.Controls.Add(new Label {
                Dock = DockStyle.Fill, TextAlign = ContentAlignment.MiddleLeft,
                Text = "One UWX session  •  No extra VRChat polling",
                ForeColor = MutedColor, Font = new Font("Segoe UI", 8F)
            }, 0, 4);
            Controls.Add(layout);
            FormClosing += (_, e) => {
                if (e.CloseReason == CloseReason.UserClosing) {
                    e.Cancel = true;
                    Hide(); // Closing QuickDeck never closes UWX.
                }
            };
            Move += (_, _) => {
                if (WindowState == FormWindowState.Normal && Visible)
                    VRCXStorage.Instance.Set("UWX_QuickDeckPosition", $"{Left},{Top}");
            };
        }

        private void AddAction(TableLayoutPanel layout, string name, string route, int col, int row)
        {
            var button = new Button {
                Text = name, Dock = DockStyle.Fill,
                Margin = new Padding(3), FlatStyle = FlatStyle.Flat,
                BackColor = SurfaceColor, ForeColor = TextColor,
                Cursor = Cursors.Hand, Font = new Font("Segoe UI", 9F, FontStyle.Bold)
            };
            button.FlatAppearance.BorderColor = Color.FromArgb(48, 68, 64);
            button.FlatAppearance.MouseOverBackColor = Color.FromArgb(30, 65, 52);
            button.Click += (_, _) => Navigate(route);
            layout.Controls.Add(button, col, row);
        }

        private static Point RestoreLocation()
        {
            try {
                var value = (VRCXStorage.Instance.Get("UWX_QuickDeckPosition") ?? "").Split(',');
                if (value.Length == 2 &&
                    int.TryParse(value[0], out var x) &&
                    int.TryParse(value[1], out var y)) {
                    var p = new Point(x, y);
                    var bounds = new Rectangle(x, y, 395, 380);
                    foreach (Screen screen in Screen.AllScreens) {
                        var area = Rectangle.Intersect(bounds, screen.WorkingArea);
                        if (area.Width >= 170 && area.Height >= 130) return p;
                    }
                }
            } catch { /* Default to visible center of current screen. */ }
            var work = Screen.PrimaryScreen?.WorkingArea ?? new Rectangle(0, 0, 1280, 720);
            return new Point(work.Right - 410, work.Top + 70);
        }

        internal void UpdateSummary(int onlineCount, string world)
        {
            if (IsDisposed) return;
            _friendsText.Text = $"Friends online · {Math.Clamp(onlineCount, 0, 99999)}";
            _worldText.Text = "World · " + (string.IsNullOrWhiteSpace(world) ? "Not recorded" : world.Trim());
            _worldText.AccessibleDescription = _worldText.Text;
        }

        private static void Navigate(string route)
        {
            // Every route is a hardcoded, allowlisted internal action; no arbitrary scripting.
            if (route != "uwx-people" && route != "uwx-worlds" &&
                route != "uwx-invites" && route != "uwx-osc" &&
                route != "search" && route != "underweb") return;
            var main = MainForm.Instance;
            if (main == null || main.IsDisposed) return;
            main.Focus_Window();
            if (main.Browser != null && main.Browser.CanExecuteJavascriptInMainFrame) {
                string routeJson = JsonSerializer.Serialize(route);
                main.Browser.ExecuteScriptAsync(
                    "window.dispatchEvent(new CustomEvent('uwx-quickdeck-navigate',{detail:" + routeJson + "}));"
                );
            }
        }
    }

    internal static class UwxQuickDeckManager
    {
        private static UwxQuickDeckForm? _window;
        private static int _count;
        private static string _world = "";

        internal static void Show()
        {
            var main = MainForm.Instance;
            if (main == null || main.IsDisposed || !main.IsHandleCreated) return;
            if (main.InvokeRequired) {
                main.BeginInvoke((Action)Show);
                return;
            }
            if (_window == null || _window.IsDisposed) _window = new UwxQuickDeckForm();
            _window.UpdateSummary(_count, _world);
            _window.Show();
            _window.BringToFront();
            _window.Activate();
            // It's a separate native form and remains usable when UWX is minimized.
        }

        internal static void UpdateSummary(int count, string world)
        {
            var main = MainForm.Instance;
            if (main == null || main.IsDisposed || !main.IsHandleCreated) return;
            if (main.InvokeRequired) {
                main.BeginInvoke(new Action(() => UpdateSummary(count, world)));
                return;
            }
            _count = Math.Clamp(count, 0, 99999);
            _world = (world ?? "").Length > 160 ? world.Substring(0, 160) : (world ?? "");
            if (_window != null && !_window.IsDisposed)
                _window.UpdateSummary(_count, _world);
        }
    }
}
#endif
