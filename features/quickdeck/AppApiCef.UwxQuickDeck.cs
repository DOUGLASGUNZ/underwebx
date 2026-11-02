// UWX RC38: expose small, explicitly opt-in native companion controls through the
// existing AppApi JavaScript binding. No second browser process / VRChat login.
#if !LINUX
namespace VRCX
{
    public partial class AppApiCef
    {
        public void ShowUwxQuickDeck()
        {
            UwxQuickDeckManager.Show();
        }

        public void UpdateUwxQuickDeckSummary(int onlineFriends, string currentWorld)
        {
            UwxQuickDeckManager.UpdateSummary(onlineFriends, currentWorld);
        }
    }
}
#endif
