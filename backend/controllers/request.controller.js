import Request from '../models/request.model.js';
import Chat from '../models/chat.model.js';
import User from '../models/user.model.js';

// Get user room name
const userRoom = (userId) => `user:${userId}`;


export const sendRequestController = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.id;

    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID is required' });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot send request to yourself' });
    }

    // Check if a chat already exists between these users
    const existingChat = await Chat.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (existingChat) {
      return res.status(400).json({ error: 'You are already in a chat with this user' });
    }

    // Check if there is already a pending request
    const existingRequest = await Request.findOne({
      status: 'pending',
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'A request already exists between you and this user' });
    }

    const request = await Request.create({
      sender: senderId,
      receiver: receiverId,
      status: 'pending'
    });

    const populatedRequest = await Request.findById(request._id)
      .populate('sender', 'name email');

    // Emit to receiver
    const io = req.app.get('io');
    if (io) {
      io.to(userRoom(receiverId)).emit('request:new', populatedRequest);
    }


    res.status(201).json({ message: 'Request sent', request: populatedRequest });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Request already sent' });
    }
    console.error('Send request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPendingRequestsController = async (req, res) => {
  try {
    const requests = await Request.find({
      receiver: req.user.id,
      status: 'pending'
    })
    .populate('sender', 'name email')
    .sort({ createdAt: -1 });

    res.status(200).json({ requests });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const acceptRequestController = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const request = await Request.findOne({ _id: requestId, receiver: userId, status: 'pending' });

    if (!request) {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }

    // Mark as accepted (we could also delete it, but marking as accepted leaves a record)
    request.status = 'accepted';
    await request.save();

    // Check if chat already exists just in case
    let chat = await Chat.findOne({
      participants: { $all: [request.sender, request.receiver] }
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [request.sender, request.receiver],
        createdBy: request.sender
      });
    }

    const populatedChat = await Chat.findById(chat._id)
      .populate('participants', 'name email');

    const io = req.app.get('io');
    if (io) {
      // Notify sender that their request was accepted and the chat was created
      io.to(userRoom(request.sender.toString())).emit('chat:created', populatedChat);
      // We could also emit to the receiver, but they already get the HTTP response
      // Still good for multi-device sync:
      io.to(userRoom(userId)).emit('chat:created', populatedChat);
    }


    res.status(200).json({ message: 'Request accepted', chat: populatedChat });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const rejectRequestController = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    // Delete the request entirely so they can try again
    const deletedRequest = await Request.findOneAndDelete({
      _id: requestId,
      receiver: userId,
      status: 'pending'
    });

    if (!deletedRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.status(200).json({ message: 'Request rejected and deleted' });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
