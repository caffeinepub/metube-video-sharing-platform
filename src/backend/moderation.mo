import Text "mo:core/Text";
import Array "mo:core/Array";
import Char "mo:core/Char";

module {
  type ModerationResult = {
    #allowed;
    #flagged : Text;
  };

  let chatRoomError = "Sexually explicit content is not permitted on ArtificialTV. Please revise your message to remove explicit content.";
  let sexualContentError = "Sexually explicit content is not permitted on ArtificialTV. Please revise the metadata (title/description/tags) to remove explicit content. Moderation restrictions apply to uploaded content (NOT to descriptions of AI-generated content).";

  let sexualKeywords = [
    "sex",
    "porn",
    "cock",
    "sexy",
    "genital",
    "pussy",
    "penis",
    "vagina",
    "anal",
    "nude",
    "naked",
    "fuck",
    "fucking",
    "fucked",
    "dick",
  ];

  func containsSexualKeywords(text : Text) : Bool {
    let lowerText = Text.fromIter(text.chars().map(func(c) { if (c >= 'A' and c <= 'Z') { Char.fromNat32(c.toNat32() + 32) } else { c } }));
    sexualKeywords.any(
      func(keyword) {
        lowerText.contains(#text keyword);
      }
    );
  };

  func anyTagContainsSexualKeywords(tags : [Text]) : Bool {
    tags.any(
      func(tag) {
        containsSexualKeywords(tag);
      }
    );
  };

  public func moderateImageMetadata(image : {
    title : Text;
    description : Text;
    tags : [Text];
  }) : ModerationResult {
    // Reject if any field contains sexual keywords
    if (containsSexualKeywords(image.title) or containsSexualKeywords(image.description)) {
      return #flagged(sexualContentError);
    };
    // Check tags
    if (anyTagContainsSexualKeywords(image.tags)) {
      return #flagged(sexualContentError);
    };
    #allowed;
  };

  public func moderateChatMessage(message : Text) : ModerationResult {
    if (containsSexualKeywords(message)) {
      return #flagged(chatRoomError);
    };
    #allowed;
  };
};
