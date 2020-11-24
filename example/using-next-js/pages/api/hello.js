// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default (req, res) => {
  try {
    test();
    res.code(201).json({ name: 'John Doe' });
  } catch (error) {
    res.code(error.code || 500).json({ message: error.message });
  }
}
